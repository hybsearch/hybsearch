# hybsearch

A Hoplon project with Castra designed to...well, that part is up to you.

## Dependencies
- java 1.7+
- [boot][1] (1.1.x)
- [leiningen][2]
- mongodb
- clustal-w

## Instructions
1. Open a terminal
2. If you're on a Mac, install [Homebrew](http://brew.sh)
3. Install a bunch of stuff: `brew install leiningen mongodb homebrew/science/clustal-w caskroom/cask/brew-cask`
4. Install Java: `brew cask install java`
5. Install `boot`:
	- `curl https://clojars.org/repo/tailrecursion/boot/1.1.1/boot-1.1.1.jar > boot`
	- `chmod u+x boot`
	- `mv boot /usr/local/bin/boot`
6. Start the database: `launchctl load ~/Library/LaunchAgents/homebrew.mxcl.mongodb.plist`

## Usage
1. In a terminal, run `boot development`.
2. Go to [http://localhost:8000][3] in your browser.
3. You're already done! (Well, running it, at least.)

## License
MIT License

[1]: https://github.com/tailrecursion/boot
[2]: https://github.com/technomancy/leiningen
[3]: http://localhost:8000
