import { UserSchema } from "../models/user.ts"
import { sendEmail } from "../services/email.service.ts"
import { renderTemplate } from "../services/eta.service.ts"

export const sendInvitationToJoinEsusu = async ({
  inviter,
  esusuId,
  invitationKey,
  invitee,
}: {
  inviter: UserSchema
  esusuId: string
  invitationKey: string
  invitee: string
}) => {
  const emailTemplate = renderTemplate("./send-esusu-invite", {
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
