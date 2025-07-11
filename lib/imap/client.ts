import Imap from 'imap'
import { simpleParser, ParsedMail, Attachment } from 'mailparser'
import { IMAPConfig, EmailMessage, EmailAttachment } from './types'

export class IMAPClient {
  private config: IMAPConfig
  private connection: Imap | null = null

  constructor(config: IMAPConfig) {
    this.config = config
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.connection = new Imap({
        user: this.config.email,
        password: this.config.password,
        host: this.config.host,
        port: this.config.port,
        tls: this.config.tls,
        tlsOptions: { rejectUnauthorized: false },
        connTimeout: 30000,
        authTimeout: 30000
      })

      this.connection.once('ready', () => {
        resolve()
      })

      this.connection.once('error', (err: Error) => {
        reject(err)
      })

      this.connection.connect()
    })
  }

  async disconnect(): Promise<void> {
    return new Promise((resolve) => {
      if (this.connection) {
        this.connection.end()
        this.connection = null
      }
      resolve()
    })
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.connect()
      await this.disconnect()
      return true
    } catch (error) {
      return false
    }
  }

  async getEmailsWithAttachments(limit: number = 50): Promise<EmailMessage[]> {
    if (!this.connection) {
      throw new Error('Not connected to IMAP server')
    }

    return new Promise((resolve, reject) => {
      const emails: EmailMessage[] = []

      this.connection!.openBox('INBOX', true, (err, box) => {
        if (err) {
          reject(err)
          return
        }

        // Search for emails with attachments
        this.connection!.search(['ALL'], (err, results) => {
          if (err) {
            reject(err)
            return
          }

          if (!results || results.length === 0) {
            resolve([])
            return
          }

          // Get the most recent emails up to the limit
          const messagesToFetch = results.slice(-limit).reverse()
          
          const fetch = this.connection!.fetch(messagesToFetch, {
            bodies: '',
            struct: true
          })

          fetch.on('message', (msg, seqno) => {
            let buffer = ''
            let attributes: any = {}

            msg.on('body', (stream, info) => {
              stream.on('data', (chunk) => {
                buffer += chunk.toString('utf8')
              })

              stream.on('end', () => {
                // Parse will happen after we have attributes
              })
            })

            msg.on('attributes', (attrs) => {
              attributes = attrs
            })

            msg.on('end', async () => {
              try {
                const parsed = await simpleParser(buffer)
                const hasAttachments = this.hasAttachments(attributes.struct)

                if (hasAttachments) {
                  emails.push({
                    uid: attributes.uid.toString(),
                    messageId: parsed.messageId || '',
                    subject: parsed.subject || '(No Subject)',
                    from: parsed.from?.text || 'Unknown',
                    date: parsed.date || new Date(),
                    hasAttachments: true,
                    attachments: this.extractAttachmentInfo(parsed)
                  })
                }
              } catch (error) {
                console.error('Error parsing email:', error)
              }
            })
          })

          fetch.once('error', (err) => {
            reject(err)
          })

          fetch.once('end', () => {
            resolve(emails)
          })
        })
      })
    })
  }

  async getEmailDetails(uid: string): Promise<EmailMessage | null> {
    if (!this.connection) {
      throw new Error('Not connected to IMAP server')
    }

    return new Promise((resolve, reject) => {
      this.connection!.openBox('INBOX', true, (err, box) => {
        if (err) {
          reject(err)
          return
        }

        const fetch = this.connection!.fetch(uid, {
          bodies: '',
          struct: true
        })

        let emailData: EmailMessage | null = null

        fetch.on('message', (msg, seqno) => {
          let buffer = ''
          let attributes: any = {}

          msg.on('body', (stream, info) => {
            stream.on('data', (chunk) => {
              buffer += chunk.toString('utf8')
            })
          })

          msg.on('attributes', (attrs) => {
            attributes = attrs
          })

          msg.on('end', async () => {
            try {
              const parsed = await simpleParser(buffer)
              
              emailData = {
                uid: attributes.uid.toString(),
                messageId: parsed.messageId || '',
                subject: parsed.subject || '(No Subject)',
                from: parsed.from?.text || 'Unknown',
                date: parsed.date || new Date(),
                hasAttachments: this.hasAttachments(attributes.struct),
                attachments: this.extractAttachmentInfo(parsed),
                body: parsed.text || parsed.html || ''
              }
            } catch (error) {
              console.error('Error parsing email details:', error)
            }
          })
        })

        fetch.once('error', (err) => {
          reject(err)
        })

        fetch.once('end', () => {
          resolve(emailData)
        })
      })
    })
  }

  async downloadAttachments(uid: string): Promise<Array<{ filename: string; content: Buffer; contentType: string }>> {
    if (!this.connection) {
      throw new Error('Not connected to IMAP server')
    }

    return new Promise((resolve, reject) => {
      this.connection!.openBox('INBOX', true, (err, box) => {
        if (err) {
          reject(err)
          return
        }

        const attachments: Array<{ filename: string; content: Buffer; contentType: string }> = []
        
        const fetch = this.connection!.fetch(uid, {
          bodies: '',
          struct: true
        })

        fetch.on('message', (msg, seqno) => {
          let buffer = ''

          msg.on('body', (stream, info) => {
            stream.on('data', (chunk) => {
              buffer += chunk.toString('utf8')
            })

            stream.on('end', async () => {
              try {
                const parsed = await simpleParser(buffer)
                
                if (parsed.attachments && parsed.attachments.length > 0) {
                  for (const attachment of parsed.attachments) {
                    attachments.push({
                      filename: attachment.filename || 'unnamed',
                      content: attachment.content,
                      contentType: attachment.contentType || 'application/octet-stream'
                    })
                  }
                }
              } catch (error) {
                console.error('Error downloading attachments:', error)
              }
            })
          })
        })

        fetch.once('error', (err) => {
          reject(err)
        })

        fetch.once('end', () => {
          resolve(attachments)
        })
      })
    })
  }

  private hasAttachments(struct: any[]): boolean {
    if (!struct) return false

    for (const part of struct) {
      if (Array.isArray(part)) {
        if (this.hasAttachments(part)) return true
      } else if (part.disposition && part.disposition.type === 'attachment') {
        return true
      }
    }
    return false
  }

  private extractAttachmentInfo(parsed: ParsedMail): EmailAttachment[] {
    const attachments: EmailAttachment[] = []

    if (parsed.attachments && parsed.attachments.length > 0) {
      for (const att of parsed.attachments) {
        attachments.push({
          filename: att.filename || 'unnamed',
          size: att.size || 0,
          contentType: att.contentType || 'application/octet-stream',
          contentId: att.contentId
        })
      }
    }

    return attachments
  }
}