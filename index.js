require('dotenv').config()
const Discord = require('discord.js')
const bot = new Discord.Client()
const TOKEN = process.env.TOKEN

require('ffmpeg')
const ytdl = require("ytdl-core")

const axios = require('axios').default
const axiosCookieJarSupport = require('axios-cookiejar-support').default
const tough = require('tough-cookie')

axiosCookieJarSupport(axios)
const cookieJar = new tough.CookieJar()
/* Login */

bot.login(TOKEN)

bot.on('ready', () => {
  console.info(`Logged in as ${bot.user.tag}!`)
  bot.user.setUsername('Factorio Server Manager')
  
  /* Login to the FSM */
  axios.post(`${ip}/api/login`, {
    username: 'admin',
    password: 'factorio'
  }, {
    jar: cookieJar,
    withCredentials: true
  }).then(res => {
    bot.channels.get('752942899427016875').send(createEmbed('!fsm login', [{ name: 'Server response', value: 'Logged in' }]))
  })

  /* Server status controller */

  let status

  async function play(connection, url) {
    connection.play(await ytdl(url), { type: 'opus' });
  }

  setInterval(() => {
    axios.get(`${ip}/api/server/status`, {
      jar: cookieJar,
      withCredentials: true
    }).then(res => {
      const {data} = res.data
      let message
      if (status != data.status) {
        status = data.status
        const voiceChannel = bot.channels.get('742490683696480285')
        if (data.status === 'running') {
          message = 'running - 🟢'
          if (!voiceChannel) return console.error("The channel does not exist!")
          voiceChannel.join().then(connection => {
            connection.play(ytdl('https://www.youtube.com/watch?v=Gb2jGy76v0Y&ab_channel=Ballyweg'), {
              filter: "audioonly"
            }).on('end', () => {
              voiceChannel.leave()
            })
          }).catch(e => {
            // Oh no, it errored! Let's log it to console :)
            console.error(e)
          })
        } else {
          message = 'stopped - 🔴'
          if (!voiceChannel) return console.error("The channel does not exist!")
          voiceChannel.join().then(connection => {
            connection.play(ytdl('https://www.youtube.com/watch?v=Gb2jGy76v0Y&ab_channel=Ballyweg'), {
              filter: "audioonly"
            }).on('end', () => {
              voiceChannel.leave()
            })
          }).catch(e => {
            // Oh no, it errored! Let's log it to console :)
            console.error(e)
          })
          
        }
        bot.channels.get('752942899427016875').send(createEmbed('!fsm status', [{ name: 'Server status', value: message }]))
      }
    })
  }, 1000)
});

/* Embed */

const createEmbed = (command, fields) => {
  return {embed: {
    color: 3447003,
    descriptio: `Your command: ${command}`,
    fields: fields,
    timestamp: new Date(),
    footer: {
      text: "© Powered by Michu#2510"
    }
  }}
}

/* Messages controller */

bot.on('message', msg => {
  if (msg.content.startsWith('!fsm')) {
    const message = msg.content.split(' ')

    if (message.length > 1) {
      const command = message[1]

      switch(command) {
        case 'help':
            msg.channel.send(createEmbed(msg.content, [{ name: 'Commands list:', value: '!fsm login\n!fsm logout\n!fsm status\n!fsm start\n!fsm stop\n!fsm saves', inline: true }]))
            break;
        case 'login':
          login(msg)
          break;
        case 'logout':
          logout(msg)
          break;
        case 'status':
          getStatus(msg)
          break;
        case 'start':
          startServer(msg)
          break;
        case 'saves':
          savesList(msg)
          break;
        case 'stop':
          stopServer(msg)
          break;
        default:
            msg.channel.send(createEmbed(msg.content, [{ name: 'Unknown command', value: 'Use: !fsm help' }]))
            break;
      }
    }
  }
});

let ip = 'http://34.91.102.185:8080'

const login = (msg) => {
  if (msg.member._roles.includes('752949908259995708')) {
    port = parseInt(port)
    axios.post(`${ip}/api/login`, {
      username: 'admin',
      password: 'factorio'
    }, {
      jar: cookieJar,
      withCredentials: true
    }).then(res => {
      msg.channel.send(createEmbed(msg.content, [{ name: 'Server response', value: res.data.data || 'Logged in' }]))
    })
  } else {
    msg.channel.send(createEmbed(msg.content, [{ name: 'Permission denied', value: 'You must be FSM administrator' }]))
  }
}

const logout = (msg) => {
  if (msg.member._roles.includes('752949908259995708')) {
    port = parseInt(port)
    axios.get(`${ip}/api/logout`, {
      jar: cookieJar,
      withCredentials: true
    }).then(res => {
      msg.channel.send(createEmbed(msg.content, [{ name: 'Server response', value: res.data.data || 'Logged out' }]))
    })
  } else {
    msg.channel.send(createEmbed(msg.content, [{ name: 'Permission denied', value: 'You must be FSM administrator' }]))
  }
}

const getStatus= (msg) => {
  axios.get(`${ip}/api/server/status`, {
    jar: cookieJar,
    withCredentials: true
  }).then(res => {
    const {data} = res.data
    let message
    if (data.status === 'running') {
      message = 'running - 🟢'
    } else {
      message = 'stopped - 🔴'
    }
    msg.channel.send(createEmbed(msg.content, [{ name: 'Server status', value: message }]))
  })
}

const compare = (a, b) => {
  if ( a.last_mod < b.last_mod ){
    return -1;
  }
  if ( a.last_mod > b.last_mod ){
    return 1;
  }
  return 0;
}

const formatDate = (date) => {
  date = new Date(date)
  return `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()} - ${date.getHours()}:${date.getMinutes()}:${date.getSeconds}`
}

const savesList = (msg) => {
  if (msg.member._roles.includes('752949908259995708')) {
    axios.get(`${ip}/api/saves/list`, {
      jar: cookieJar,
      withCredentials: true
    }).then(res => {
      const {data} = res.data
      data = data.sort(compare)
      let fields = []
      data.forEach(save => {
        fields.push({ name: save.name, value: `${formatDate(save.last_mod)} - ${(save.size / 1024 / 1024).toFixed(3)}MB` })
      })
      msg.channel.send(createEmbed(msg.content, fields))
    })
  } else {
    msg.channel.send(createEmbed(msg.content, [{ name: 'Permission denied', value: 'You must be FSM administrator' }]))
  }
}

const startServer = (msg, savefile = 'Load Latest', host = '0.0.0.0', port = 34197) => {
  port = parseInt(port)
  axios.post(`${ip}/api/server/start`, {
      bindip: host,
      savefile: savefile,
      port: port
  }, {
    jar: cookieJar,
    withCredentials: true
  }).then(res => {
    msg.channel.send(createEmbed(msg.content, [{ name: 'Server response', value: res.data.data }]))
  })
}


const stopServer = (msg) => {
  if (msg.member._roles.includes('752949908259995708')) {
    axios.get(`${ip}/api/server/stop`, {
      jar: cookieJar,
      withCredentials: true
    }).then(res => {
      msg.channel.send(createEmbed(msg.content, [{ name: 'Server response', value: res.data.data }]))
    })
  } else {
    msg.channel.send(createEmbed(msg.content, [{ name: 'Permission denied', value: 'You must be FSM administrator' }]))
  }
}