import { WebClient } from "@slack/web-api";

const web = new WebClient(process.env.SLACK_ACCESS_TOKEN);

const zendeskApiCreds = `${process.env.ZENDESK_API_USERNAME}:${process.env.ZENDESK_API_TOKEN}`;
const zendeskApiAuthHeader = `Basic ${btoa(zendeskApiCreds)}`;

export default async function del(payload) {
  const suspensionId = +payload.actions[0].value;

  await fetch(
    `https://prx.zendesk.com/api/v2/suspended_tickets/${suspensionId}`,
    {
      method: "DELETE",
      headers: new Headers({
        Authorization: zendeskApiAuthHeader,
      }),
    },
  );

  console.info(`Deleted suspended ticket ${suspensionId}`);

  const ticketSubject = payload.message.blocks[0].text.text;

  await web.chat.update({
    channel: payload.channel.id,
    ts: payload.message.ts,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*${ticketSubject}* was :x: deleted by <@${payload.user.id}>`,
        },
      },
    ],
  });
}
