# Zendesk Toolkit

A collection of utilities that integrate with [Zendesk](https://www.zendesk.com/) to provide additional functionality or conveniences.

## Components

### Suspended Tickets Poller

Periodically queries the [suspended tickets API](https://developer.zendesk.com/api-reference/ticketing/tickets/suspended_tickets/). When new suspended tickets are found, an [interactive message](https://api.slack.com/messaging/interactivity) is sent to [Slack](https://slack.com/). This is intended to increase the visibility of suspended tickets, and make management (deleting or recovering) easier, faster, and more likely.

The poller is a [Lambda](https://aws.amazon.com/lambda/) function that is invoked periodically. There is also a [DynamoDB](https://aws.amazon.com/dynamodb/) table that is used as a lightweight cache, to keep track of which tickets the poller has already seen, and prevent sending multiple messages to Slack for the same ticket.

The cache keeps a record of each ticket for 7 days from the first time it sees the ticket. Suspended tickets are automatically deleted from Zendesk if they remain suspended for 14 days. This means that a ticket should generate two messages to Slack if it's not otherwise dealt with during that 14 day window.

### Slack Interactivity Endpoint

A Lambda function with a [function URL](https://docs.aws.amazon.com/lambda/latest/dg/lambda-urls.html) that handles interactivity requests coming from a Slack App. The interactive messages are generated elsewhere. For example, the **Suspended Tickets Poller** creates messages for suspended tickets with buttons to _delete_ or _recover_ those tickets. This endpoint is responsible for perfoming those actions in response to a button being selected.

This function should handle **all** interactivity requests related to the Zendesk Toolkit. Do not create new interactivity endpoints for various message sources.

## Deployment

The entire Zendesk Toolkit is deployed using [AWS SAM](), generally by running `sam build && sam deploy --resolve-s3` locally. See `samconfig.toml` for additional deployment details. If stack parameters need to be added or changed, use the `parameter_overrides` section of `samconfig.toml`. Include (uncommment) only the parameters that are being affected; SAM will use existing values for all other parameters.

Only a single instance of Zendesk Toolkit should be deployed. All new functionality should be added to the existing template and deployed to the existing stack. This is true even if some component is being duplicated, such as if a **Suspended Tickets Poller** is being spun up for a new Zendesk instance. **Do not**, for example, create separate Zendesk Toolkits for both the PRX and PRX Accounting Zendesk instances.

A single Slack App exists in the PRX Slack workspace to handle all integration between Slack and the Zendesk Toolkit.
