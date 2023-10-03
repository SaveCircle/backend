import { sendEmail } from "../services/email.service.ts"
import { renderTemplate } from "../services/eta.service.ts"

export const sendInvitationToJoinEsusu = async ({
  inviter,
  esusuId,
  invitationKey,
  invitee,
  esusuName
}: {
  inviter: string
  esusuId: string
  invitationKey: string
  invitee: string
  esusuName: string
}) => {
  const emailTemplate = renderTemplate("./send-esusu-invite", {
    esusuName,
    inviter,
    invitationLink: `<a style='color:white;' href='https://localhost:1990/api/v1/${esusuId}/${invitationKey}' rel='noreferrer' target='_blank'>Accept Invite</a>`,
  })
  return await sendEmail({
    subject: `You have an invite!`,
    to: invitee,
    content: emailTemplate,
    html: emailTemplate,
  })
}
