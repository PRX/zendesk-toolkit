import { WebClient } from "@slack/web-api";

const web = new WebClient(process.env.SLACK_ACCESS_TOKEN);

const zendeskApiCreds = `${process.env.ZENDESK_API_USERNAME}:${process.env.ZENDESK_API_TOKEN}`;
const zendeskApiAuthHeader = `Basic ${btoa(zendeskApiCreds)}`;

export default async function recover(payload) {
  const suspensionId = +payload.actions[0].value;

  const resp = await fetch(
    `https://prx.zendesk.com/api/v2/suspended_tickets/recover_many?ids=${suspensionId}`,
    {
      method: "PUT",
      headers: new Headers({
        Authorization: zendeskApiAuthHeader,
      }),
    },
  );

  const respPayload = await resp.json();
  const { tickets } = respPayload;
  const ticketId = tickets[0].id;

  console.info(
    `Recovered suspended ticket ${suspensionId} as ticket ${ticketId}`,
  );

  const ticketSubject = payload.message.blocks[0].text.text;

  await web.chat.update({
    channel: payload.channel.id,
    ts: payload.message.ts,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*${ticketSubject}* was :white_check_mark: <https://prx.zendesk.com/agent/tickets/${ticketId}|recovered> by <@${payload.user.id}>`,
        },
      },
    ],
  });
}
