export default function msg(ticket) {
  return {
    username: "Zendesk",
    icon_emoji: ":zendesk:",
    channel: process.env.SLACK_CHANNEL_ID,
    unfurl_links: false,
    unfurl_media: false,
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: ticket.subject,
          emoji: true,
        },
      },
      {
        type: "context",
        elements: [
          {
            type: "plain_text",
            text: `From: ${ticket.author.email}`,
            emoji: true,
          },
        ],
      },
      {
        type: "divider",
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: ticket.content.slice(0, 1000),
        },
      },
      {
        type: "divider",
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "Delete",
              emoji: true,
            },
            style: "danger",
            value: `${ticket.id}`,
            action_id: "DELETE",
            confirm: {
              title: {
                type: "plain_text",
                text: "Permanently delete ticket?",
              },
              text: {
                type: "plain_text",
                text: `Are you sure you want to delete this ticket:\n"${ticket.subject}"?\n\nThe ticket will be deleted immediately and this cannot be undone.`,
              },
              confirm: {
                type: "plain_text",
                text: "Yes, delete forever",
              },
              deny: {
                type: "plain_text",
                text: "Cancel",
              },
              style: "danger",
            },
          },
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "Recover",
              emoji: true,
            },
            style: "primary",
            value: `${ticket.id}`,
            action_id: "RECOVER",
          },
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "Ignore",
              emoji: true,
            },
            value: `${ticket.id}`,
            action_id: "IGNORE",
          },
        ],
      },
    ],
  };
}
