const es = {
  chatClient: {
    commands: {
      createReward: {
        missingTitle: "Debes indicar un título para la recompensa",
        rewardCreated(title: string, cost: number) {
          return `Creada recompensa "${title}" con un costo de ${cost}`;
        },
      },
    },
    availableCommands(names: Array<string>) {
      return `Comandos disponibles: "${names.join('", "')}"`;
    },
    addedVip(username: string) {
      return `Otorgado VIP a @${username}`;
    },
    removeVip(username: string) {
      return `Eliminado VIP de @${username}`;
    },
  },
  helpers: {
    util: {
      msText: {
        second: ["segundo", "segundos"],
        minute: ["minuto", "minutos"],
      },
    },
  },
  pubSubClient: {
    actions: {
      lightTheme: {
        message: `¡Disfruta de un dia iluminado!`,
        messageTimeIncreased(duration: string) {
          return `Aumentado el tiempo con tema claro por ${duration}`;
        },
        cumulatedTime(cumulated: string) {
          return `(tiempo acumulado ${cumulated})`;
        },
      },
      hidrate: {
        message(username: string) {
          return `@${username} ha invitado a una ronda`;
        },
        chatMessage: "waterGang waterGang waterGang",
      },
      highlightMessage: {
        noLinksAllowed: "No se permite enviar enlaces en mensajes destacados",
      },
      russianRoulette: {
        timeoutReason: "F en la ruleta",
        survivedMessage(username: string) {
          return `PepeHands ${username} no ha sobrevivido para contarlo`;
        },
        gotShotMessage(username: string) {
          return `rdCool Clap ${username}`;
        },
      },
      stealVip: {
        noVipUsers: "No hay nadie a quien puedas robar el VIP",
        allowedUsers(users: Array<string>) {
          return `Solo puedes robar el VIP de: "${users.join('", "')}"`;
        },
        message(addVipUser: string, removeVipUser: string) {
          return `@${addVipUser} ha "tomado prestado" el VIP de @${removeVipUser}`;
        },
      },
      timeoutFriend: {
        timeoutReason(username: string) {
          return `Timeout dado por @${username} con puntos del canal`;
        },
        message(username: string, timedOutUser: string, timeAmount: string) {
          return `@${username} ha expulsado a @${timedOutUser} por ${timeAmount}`;
        },
      },
    },
  },
};

export { es };
