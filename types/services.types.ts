import { Attachment } from "https://deno.land/x/denomailer@1.6.0/config/mail/attachments.ts"
import { Content } from "https://deno.land/x/denomailer@1.6.0/config/mail/content.ts"
import { mailList } from "https://deno.land/x/denomailer@1.6.0/config/mail/email.ts"

export interface SendEmailConfig {
  to: mailList
  cc?: mailList
  bcc?: mailList
  from: string
  date?: string
  subject: string
  content?: string
  mimeContent?: Content[]
  html?: string
  inReplyTo?: string
  replyTo?: string
  references?: string
  priority?: "high" | "normal" | "low"
  attachments?: Attachment[]
  internalTag?: string | symbol
  headers: Record<string, string>
}
