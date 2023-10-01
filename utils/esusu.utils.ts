import { sendEmail } from "../services/email.service.ts"
import { renderTemplate } from "../services/eta.service.ts"

export const sendInvitationToJoinEsusu = async ({
  invitee,
  esusuId,
  invitationKey,
}: {
  invitee: string
  esusuId: string
  invitationKey: string
}) => {
  const emailTemplate = renderTemplate("./verify-email", {
    user: {},
    verificationLink: `<a style='color:white;' href='https://localhost:1990/api/v1' rel='noreferrer' target='_blank'>Verify Email</a>`,
  })
  return await sendEmail({
    subject: `You have an invite!`,
    to: invitee,
    content: emailTemplate,
    html: emailTemplate,
  })
}
