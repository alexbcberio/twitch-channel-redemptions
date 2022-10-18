# Twitch Channel Redemptions

This tool let's you manage Twitch [channel point redemptions](https://help.twitch.tv/s/article/channel-points-guide) and create unique experiences. When a viewer redeems a reward it creates a unique interaction. The limit of what you can do is your imagination.

The tool is freely available for anyone, you can set it up for your channel easily!

These are some of the available interactions:

- Timeout user: make them go await for a minute (configurable).
- Get VIP role: give VIP to a user up to a limit, once the limit is reached it removes the oldest user who obtained the VIP **with this tool**.
- Steal VIP from a user: steal the VIP from anyone who got it **using this tool** and assigns it to this user. It cannot be used to take the VIP of a user who obtained it using other methods.

> Feel free to contact me if you need any help via [Twitter](https://twitter.com/alexbcberio) or [Discord](https://discord.com/users/202915432175239169).
>
> Requests for new interaction are welcome! Check below for more information.
>
> ![Emote of a cat with a heart (nekolove) from FrankerFacez](https://cdn.frankerfacez.com/emote/244375/1)

## Important

### Channel points acceptable use policy

Remember to follow Twitch's [Channel Points Acceptable Use Policy](https://www.twitch.tv/p/en/legal/channel-points-acceptable-use-policy/) whenever you use this tool. We will not take any responsibility for its bad use.

### Bug reports

Bugs, no thanks. Please report them [here](https://github.com/alexbcberio/twitch-channel-redemptions/issues/new?labels=bug&template=bug_report.md).

### Request new features

Would you like me to implement something? Feel free to tell us everything [here](https://github.com/alexbcberio/twitch-channel-redemptions/issues/new?labels=enhancement&template=feature_request.md).

## Installation

### Requirements

- [NodeJS](https://nodejs.org/en/download/)
- A node package manager, recommended [Yarn](https://classic.yarnpkg.com/en/docs/install)

### Building

You only have to perform this step the first time you download it or if you make changes to the source code. Open a terminal or command-prompt and execute the following commands

1. Install node dependencies, command might differ for other package managers
   ```bash
   yarn install
   ```
2. Build the project
   ```
   yarn run build
   ```

### Starting the service

Once the build finishes open a terminal or command-prompt and run `yarn run start`.

Everything is managed via the web browser, to link it with your Twitch channel, go to [localhost:8080](http://localhost:8080) and follow the installation wizard.

Once set up, you can add the overlay to your streaming software with the same url `http://localhost:8080`.

Keep the terminal open, to stop it press `ctrl` + `c` and wait until it closes.

### Development

Open a terminal and write `yarn run start:dev`, this will restart everything whenever you make any change. Keep in mind that some features might be disabled under this environment or work in a special way.

For convenience, all channel point reward redemptions will be canceled, returning the channel points to the users (when applicable, see [create channel point rewards](#creating-channel-point-rewards), very useful for testing.

## Rewards

### Setting up channel point rewards

Once finished the [installation process](#installation) you have to set up the channel point rewards on the tool. The tool can handle the redemptions automatically, to do so the redemptions have to be created with the application itself. This restriction is imposed by Twitch ([see it in their docs](https://dev.twitch.tv/docs/api/reference#update-redemption-status)).

#### Creating channel point rewards

There's a small utility chatbot do help performing some tasks such as this one, write this command in the chat to create a channel point reward.

```txt
!createReward <title> <cost>
```

#### Linking channel point reward with an action

We call actions to the different integrations that can be set up with channel point rewards. The available actions are stored in [`src/backend/pubSubClient/actions`](./src/backend/pubSubClient/actions)

The actions are mapped to a reward in the configuration file `config/redemptions.json` where the ID of the reward is the key and the action is the value. You can get the available values from [`RedemptionType.ts`](./src/enums/RedemptionType.ts).

To get the ID of a reward start the service start the tool in [development mode](#development) and send the redemption you want to set up. It will show a message on the console like this one.

![Logs of unhandled channel point reward](./docs/img/unhandled-channel-point-reward-redemption.jpg)

The ID is shown up twice, in this case `ddcb6566-6b02-447c-a396-6b93ade3b480`.

Once the ID is correctly set up (remember to save the file) redeem again the reward, now it should not show up a message telling that the redemption was not handled.

![Logs of handled channel point reward](./docs/img/handled-channel-point-reward-redemption.jpg)

Repeat this same step for all any channel point reward you want to set up. The configuration file will look similar to this, you can repeat a action multiple times.

```json
{
  "ddcb6566-6b02-447c-a396-6b93ade3b480": "getVip",
  "3dfb7ed4-b696-4dff-92d7-18f9bfa3dd4a": "hidrate",
  "df93120a-9ebe-493c-91e1-42338400dc35": "highlightMessage",
  "53c72f19-61ae-4a27-bbe0-c8100e2fce8e": "karaokeTime",
  "f60151fc-7f62-48c6-b225-21007e0dd544": "lightTheme",
  "a7c10cae-dbea-4bdc-aeb5-ebd3d0f77b93": "lightTheme",
  "c38a6de3-ae92-4add-bd56-c6346c19ea93": "russianRoulette",
  "84283c28-a2c2-4da6-99c2-b662417b9d49": "stealVip",
  "1a6bd16d-2882-4125-9f8a-e3c7194ea8b6": "timeoutFriend"
}
```

### Create new rewards

- TODO: document how to create new rewards.
