const { Client, Util } = require('discord.js');
const { TOKEN, PREFIX, GOOGLE_API_KEY } = require('./config');
const YouTube = require('simple-youtube-api');
const ytdl = require('ytdl-core');

const client = new Client({ disableEveryone: true });

const youtube = new YouTube(GOOGLE_API_KEY);

const queue = new Map();

client.on('warn', console.warn);

client.on('error', console.error);

client.on('ready', () => console.log('Bot - WednesdayCwokie du Kylis-Lab est prêt'));

client.on('disconnect', () => console.log('Le bot a été déconnecté ! Il sera de retour dans un bref delais.'));

client.on('reconnecting', () => console.log('le bot a été reconnecté !'));

client.on('message', async msg => { // eslint-disable-line
	if (msg.author.bot) return undefined;
	if (!msg.content.startsWith(PREFIX)) return undefined;

	const args = msg.content.split(' ');
	const searchString = args.slice(1).join(' ');
	const url = args[1] ? args[1].replace(/<(.+)>/g, '$1') : '';
	const serverQueue = queue.get(msg.guild.id);

	let command = msg.content.toLowerCase().split(' ')[0];
	command = command.slice(PREFIX.length)

	if (command === 'play') {
		const voiceChannel = msg.member.voiceChannel;
		if (!voiceChannel) return msg.channel.send('❌ | Vous devez être dans un channel vocal pour pouvoir écouter de la musique. ');
		const permissions = voiceChannel.permissionsFor(msg.client.user);
		if (!permissions.has('CONNECT')) {
			return msg.channel.send('❌ | Je ne peux pas rejoindre le channel. Vous devez me mettre la permission "CONNECT" !');
		}
		if (!permissions.has('SPEAK')) {
			return msg.channel.send('❌ | Je ne peux pas parler. Vous devez me mettre la permission "SPEAK" !');
		}

		if (url.match(/^https?:\/\/(www.youtube.com|youtube.com)\/playlist(.*)$/)) {
			const playlist = await youtube.getPlaylist(url);
			const videos = await playlist.getVideos();
			for (const video of Object.values(videos)) {
				const video2 = await youtube.getVideoByID(video.id); // eslint-disable-line no-await-in-loop
				await handleVideo(video2, msg, voiceChannel, true); // eslint-disable-line no-await-in-loop
			}
			let playlist = new Discord.RichEmbed()
    
        .setDescription("La Playlist a bien été ajouté !")
        .setColor("#a86d28")
        .addField("Playlist ajouté :", `${playslist.title}`)
    
        return msg.channel.send(playlist);
		} else {
			try {
				var video = await youtube.getVideo(url);
			} catch (error) {
				try {
					var videos = await youtube.searchVideos(searchString, 10);
					let index = 0;
					msg.channel.send(`
__**Sélectionné votre Musique:**__

${videos.map(video2 => `**${++index} -** ${video2.title}`).join('\n')}

Veuillez fournir une valeur pour sélectionner l'un des résultats de recherche allant de 1 à 10.
					`);
					// eslint-disable-next-line max-depth
					try {
						var response = await msg.channel.awaitMessages(msg2 => msg2.content > 0 && msg2.content < 11, {
							maxMatches: 1,
							time: 10000,
							errors: ['time']
						});
					} catch (err) {
						console.error(err);
						return msg.channel.send('❌ | Aucune valeur saisie ou valeur invalide, sélection de video annulée.');
					}
					const videoIndex = parseInt(response.first().content);
					var video = await youtube.getVideoByID(videos[videoIndex - 1].id);
				} catch (err) {
					console.error(err);
					return msg.channel.send("🆘 | Je n'ai obtenu aucun résultat de recherche.");
				}
			}
			return handleVideo(video, msg, voiceChannel);
		}
	} else if (command === 'skip') {
		if (!msg.member.voiceChannel) return msg.channel.send("❌ | Vous n'êtes pas dans un channel vocal.");
		if (!serverQueue) return msg.channel.send('There is nothing playing that I could skip for you.');
		serverQueue.connection.dispatcher.end("✅ | La musique vient bien d'être skip !");
		return undefined;
	} else if (command === 'stop') {
		if (!msg.member.voiceChannel) return msg.channel.send("❌ | Vous n'êtes pas dans un channel vocal.");
		if (!serverQueue) return msg.channel.send("❌ | Il n'y aucune musique pour utiliser la commande.");
		serverQueue.songs = [];
		serverQueue.connection.dispatcher.end("✅ | La musique vient bien d'être arrêté !");
		return undefined;
	} else if (command === 'volume') {
		if (!msg.member.voiceChannel) return msg.channel.send("❌ | Vous n'êtes pas dans un channel vocal.");
		if (!serverQueue) return msg.channel.send('❌ | Rien ne joue actuellement.');
		if (!args[1]) 
		let volume = new Discord.RichEmbed()
    
        .setDescription("Volume")
        .setColor("#a86d28")
        .addField("Le volume est actuellement a", `${serverQueue.volume}`)
    
        return message.channel.send(volume); //return msg.channel.send(`🔊 | Le volume est actuellemnt à : **${serverQueue.volume}**`);
		serverQueue.volume = args[1];
		serverQueue.connection.dispatcher.setVolumeLogarithmic(args[1] / 5);
		let volume = new Discord.RichEmbed()
    
        .setDescription("Volume")
        .setColor("#a86d28")
        .addField("Vous avez augmenté le son de", `${args[1]}`)
    
        return message.channel.send(volume);
	} else if (command === 'np') {
		if (!serverQueue) return msg.channel.send('❌ | Rien ne joue actuellement.');
		let np = new Discord.RichEmbed()
    
        .setDescription("Np")
        .setColor("#a86d28")
        .addField("Musique actuellement joué", `${serverQueue.songs[0].title}`)
    
        return message.channel.send(np);//return msg.channel.send(`🎶 | Musique actuellement joué: **${serverQueue.songs[0].title}**`);
	} else if (command === 'queue') {
		if (!serverQueue) return msg.channel.send('❌ | Rien ne joue actuellement.');
		return msg.channel.send(`
__**File d'attente:**__

${serverQueue.songs.map(song => `**-** ${song.title}`).join('\n')}

**Actuellement en train de jouer:** ${serverQueue.songs[0].title}
		`);
	} else if (command === 'pause') {
		if (serverQueue && serverQueue.playing) {
			serverQueue.playing = false;
			serverQueue.connection.dispatcher.pause();
			return msg.channel.send('⏸ | La musique a été mis en pause !');
		}
		return msg.channel.send('❌ | Rien ne joue actuellement.');
	} else if (command === 'resume') {
		if (serverQueue && !serverQueue.playing) {
			serverQueue.playing = true;
			serverQueue.connection.dispatcher.resume();
			let resume = new Discord.RichEmbed()
    
            .setDescription("La musique a été reprit !")
            .setColor("#a86d28")
            .addField("Musique en cours", `${serverQueue.songs[0].title}`)
    
        return message.channel.send(resume);//return msg.channel.send('▶ | La musique a été reprit !');
		}
		return msg.channel.send('❌ | Rien ne joue actuellement.');
	}

	return undefined;
});

async function handleVideo(video, msg, voiceChannel, playlist = false) {
	const serverQueue = queue.get(msg.guild.id);
	console.log(video);
	const song = {
		id: video.id,
		title: Util.escapeMarkdown(video.title),
		url: `https://www.youtube.com/watch?v=${video.id}`
	};
	if (!serverQueue) {
		const queueConstruct = {
			textChannel: msg.channel,
			voiceChannel: voiceChannel,
			connection: null,
			songs: [],
			volume: 5,
			playing: true
		};
		queue.set(msg.guild.id, queueConstruct);

		queueConstruct.songs.push(song);

		try {
			var connection = await voiceChannel.join();
			queueConstruct.connection = connection;
			play(msg.guild, queueConstruct.songs[0]);
		} catch (error) {
			console.error(`Le bot n'a pu rejoindre le vocal : ${error}`);
			queue.delete(msg.guild.id);
			return msg.channel.send(`❌ | Il ne m'est impossible de rejoindre le channel vocal: ${error}`);
		}
	} else {
		serverQueue.songs.push(song);
		console.log(serverQueue.songs);
		if (playlist) return undefined;
		else 
		let musique = new Discord.RichEmbed()
    
            .setDescription("La musique a bien été ajoutée !")
            .setColor("#a86d28")
            .addField("Musique ajoutée", `${song.title}`)
    
        return message.channel.send(musique)//return msg.channel.send(`✅ | La musique **${song.title}** a bien été ajouté !`);
	}
	return undefined;
}

function play(guild, song) {
	const serverQueue = queue.get(guild.id);

	if (!song) {
		serverQueue.voiceChannel.leave();
		queue.delete(guild.id);
		return;
	}
	console.log(serverQueue.songs);

	const dispatcher = serverQueue.connection.playStream(ytdl(song.url))
		.on('end', reason => {
			if (reason === "Le flux n'est pas généré assez rapidement.") console.log(`${song.title} est actuellement terminée !`);
			else console.log(reason);
			serverQueue.songs.shift();
			play(guild, serverQueue.songs[0]);
		})
		.on('error', error => console.error(error));
	dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);

	serverQueue.textChannel.send(`🎶 | Musique joué actuellement : **${song.title}**`);
}

client.login(TOKEN);
