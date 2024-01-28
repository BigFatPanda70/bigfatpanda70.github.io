/*

	Title	:	Some common language translations for localisation stuff.

	Info	:	Version 0.0		29th May 2023

	Author	:	Nick Fleming

	Updated	:	29th May 2023

	 Notes:
	--------

	* 
	* 
	* 	**** WHERE POSSIBLE USE ICONS NOT TEXT FOR BEST RESULTS ****
	* 							~~~~~
	* 


		Just some experimental stuff for doing language translations.
	
	*important* : I haven't verified the correctness of any of these
	so if there are any errors, gramatical or otherwise let me know !

	resources:
	* 
	* https://docs.google.com/spreadsheets/d/17f0dQawb-s_Fd7DHgmVvJoEGDMH_yoSd8EYigrb0zmM/edit#gid=296134756
	* 
	* 
	* https://context.reverso.net/translation/english-french/game+over
	* 
	* https://www.definitions.net/translate/Game%20over

	- and google translate, various dictionaries and translation sites.


	misc translations, questions, musings, 
	
	english - french
		Enter the code	-> saisissez le code.

	spanish "game over" 	fin del juego  or	juego terminado  ??		https://es.wikipedia.org/wiki/Game_over

	polyglot has italian game over as "Fine partita" but online use appears to be just 'game over'.

	 Translating Game Over:
	-------------------------
		Various languages have different phrases e.g. :

				french jeu terminé
				spanish	juego terminado or Fin del juego
				german	Spiel ist aus	or Spiel vorbei
				italian gioco finito

	*but*
		Most of them appear to understand 'game over'.. so no need
	to translate, unless being very pedantic.



	oddments : https://french.stackexchange.com/questions/12969/translation-of-it-terms-like-close-next-search-etc
	* 
    Close = Fermer
    Exit = Quitter (Small difference between this and Close. I'd say you should use this one when leaving/closing some kind of workflow or the program itself, and Close when just closing a window/confirmation message)
    Cancel = Annuler
    Previous = Précédent
    Next = Suivant
    Search = Rechercher (This one can be used either to activate a search mode or to apply a entered text for the search, both are fine)
    Confirm = Confirmer
    Apply = Appliquer
    Accept/Agree = Accepter
    Decline = Refuser
    Enable = Activer
    Disable = Désactiver
	Browse => Parcourir, 
	Save => Sauvegarder, 
	Undo => Annuler,
	Edit => Editer/Modifier
	Settings => Paramètres,
	Minimise => Réduire
	Maximise => Agrandir
	* 
	* 
	* 
	ゲームオーバー	Game Over in Japanese !!
	
*/

var EnglishText =
[
	// English			// French		// Spanish		// German		// Italian
	"English",			"Français",		"Español",		"Deutsch",		"Italiano",
	"Ok",				"Ok",			"Ok",			"Ok",			"Ok",			// universal !!
	"Audio",			"Audio",		"audio",		"Audio",		"Audio",		// not checked
	"Game Over",		"Game Over",	"Game Over",	"Game Over",	"Game Over",
	"Music",			"Musique",		"Música",		"Musik",		"Musica",
	"Play",				"Jouer",		"Jugar",		"Spielen",		"Gioca",
	"Jump",				"Sauter",		"Saltar",		"Springen",		"Saltare",
	"Yes",				"Oui",			"Si",			"Ja",			"Sì",
	"No",				"Non",			"No",			"Nein",			"No",
	"Pause",			"Pause",		"Pausa",		"Pause",		"Pausa",
	"Gold",				"Or",			"Oro",			"Gold",			"Oro",
	"Silver",			"Argent",		"Plata",		"Silber",		"Argento",
	"Bronze",			"Bronze",		"Bronce",		"Bronze",		"Bronzo",
	"Up",				"Haut",			"Arriba",		"Oben",			"Su",
	"Down",				"Bas",			"Abajo",		"Unten",		"Giù",
	"Left",				"Gauche",		"Izquierda",	"Links",		"Sinistra",
	"Right",			"Droite",		"Derecha",		"Rechts",		"Destra",
	"Easy",				"Facile",		"Fácil",		"Einfach",		"Facile",
	"Medium",			"Moyen",		"Intermedio",	"Mittel",		"Medio",
	"Hard",				"Difficile",	"Dificil",		"Schwer",		"Difficile",
	"Loading",			"Chargement",	"Cargando",		"Lädt",			"Caricamento",
	"Quit",				"Quitter",		"Cerrar",		"Beenden",		"Esci",
	"Exit",				"Sortir",		"Salir",		"Beenden",		"Esci",
	"Level",			"Niveau",		"Nivel",		"Level",		"Livello",
	"Back",				"Retour",		"Volver",		"Zurück",		"Indietro",
	"Options",			"Options",		"Opciones",		"Optionen",		"Opzioni",
	"Instructions",		"Instructions", "Instrucciones","Anleitung",	"Istruzioni",
	"Shoot",			"Tirer",		"Disparar",		"Schieße",		"Sparare",
	"Keyboard",			"Clavier",		"Teclado",		"Tastatur",		"Tastiera",
	"Mouse",			"Souris",		"Ratón",		"Maus",			"Mouse",
	"Skip",				"Passer",		"Saltar",		"überspringen",	"Salta",
	"Next",				"Suivant",		"Siguiente",	"Weiter",		"Avanti",
	"Previous",			"Précédent",	"Anterior",		"Zurück",		"Indietro",
	"Stop",				"",				"",				"",				"",
	"Start",			"",				"",				"",				"",				// ???
	"Next Level",		"",				"",				"",				"",
	"Settings",			"",				"",				"",				"",
	"Controls",			"",				"",				"",				"",
	"Restart",			"",				"",				"",				"",
	"Menu",				"",				"",				"",				"",
	"Main Menu",		"",				"",				"",				"",
	"Resume",			"",				"",				"",				"",
	"Level Select",		"",				"",				"",				"",
	"Music",			"",				"",				"",				"",
	"Save",				"",				"",				"",				"",
	"Reward",			"",				"",				"",				"",
	"Win",				"",				"",				"",				"",
	"Lose",				"",				"",				"",				"",
	"Map",				"",				"",				"",				"",
	"Tutorial",			"Didacticiel",	"Tutorial",		"Tutorial",		"Tutorial",
	"Sound",			"Son",			"Sonido",		"Audio",		"Audio",		// not checked

					// french		spanish		german			italian		Portuguese(BR)
	"First",		// Première		Primer		Erster			
	"Dead",			// Mort			Muerto		Toter
	"Critical",		// Critique		Crítico		Kritischer
	"Fire",			// Feu			Fuego		Feuer
	"Max",			// max			max			max				??
	"Min",			// min			min			min				??
	"Game",			// Jue			juego		Spiel
	"Attack",		// Attaquer		Atacar		Attackiere
	"Boost",		// Booster		Potenciar	Boost
	"Level up",		// Niveau Suivant ¡Subida de nivel! Level Up
	"Lives",		// Vies			Vidas		Leben
	"High score",	// Meilleur score   Puntuación máxima   Höchstpunktzahl ???
	"Next",			// Suivant		Siguiente	Weiter
	"Volume",		// Volume		Volumen		Lautstärke
	
];
