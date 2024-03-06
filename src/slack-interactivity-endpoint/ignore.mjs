import { WebClient } from "@slack/web-api";

const web = new WebClient(process.env.SLACK_ACCESS_TOKEN);

export default async function ignore(payload) {
  const ticketSubject = payload.message.blocks[0].text.text;
  const suspensionId = +payload.actions[0].value;

  console.info(`Ignored suspended ticket ${suspensionId}`);

  await web.chat.update({
    channel: payload.channel.id,
    ts: payload.message.ts,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*${ticketSubject}* was ignored by <@${payload.user.id}>`,
        },
      },
    ],
  });
}
