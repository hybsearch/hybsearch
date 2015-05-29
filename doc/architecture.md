#Architecture Documentation

##Contents
- Future Changes
- To-Do
- Getting Started
- Project Structure
- Data Flow
- Server Architecture
- Database Architecture
- Client Architecture (User Interface)
- Processing Strategy

##Future Changes
After my most recent meeting with Steve, it seems that his desired workflow is as follows:
1. Upload a library file.
2. Process the library file under a given Clustal scheme.
3. Explore the reciprocal hybrids.

Because Steve is already filtering the sequences he wants when he searches for them in GenBank, it doesn't really make sense for us to define analysis sets from anything other than library file uploads. This is a boon, because it means that we don't need to worry about mutable sets (those defined on species names, which can expand as sequences are uploaded) anymore. It also means we can think of processing at the analysis set level (since this list of sequences is now guaranteed immutable), which removes the need for the "job" abstraction. Since we're no longer worried about the "job" abstraction, we're no longer worried about computing intersections between the job's sequences and it's analysis set's sequences. If Steve wants finer-grained processing in the future we can add it, but this should let us get the app out the door faster.

The following architecture documentation takes this into account, so it may be a little different from what is currently implemented.

##To-Do (in no particular order)
The docs are written as if most of these are finished, so they might change as time progresses, or not appear to match the implementation.
- Finish implementing the Clustal interface
- Build the sequence processing side of the server
- Build the UI for starting/stopping processing on an analysis set
- Fix some UI bugs affecting the size and scrollability of certain components
- Implement the rest of the CRUD methods
- Implement the indexing on the database
- Update the UI to match Steve's workflow
- Build the query UI
- Validate incoming data
- There are probably more.


##Getting Started
- Installing Clojure tools
- Installing MongoDB
- Running the database
- Running the server

###Installing Clojure tools
To run Clojure code and build this application, you need to have Java 1.6 ("version 6") or higher, Leiningen 2.x, and Boot (version 1) installed.
- Java install (I'm using version 8 currently):  http://www.oracle.com/technetwork/java/javase/downloads/index.html
- On OSX you can install Leiningen via homebrew, otherwise follow the instructions here: https://github.com/technomancy/leiningen/wiki/Packaging
- Boot (version 1): https://github.com/tailrecursion/boot

###Installing MongoDB
- Platform-specific instructions: http://docs.mongodb.org/manual/installation/

###Running the database
- Instructions here: http://docs.mongodb.org/manual/tutorial/install-mongodb-on-os-x/#run-mongodb

###Running the server
- Make sure that the database is running before you run the server. To run the server, `cd` into the directory containing the `build.boot` file, and run `boot development`.  

##Project Structure
```
hybsearch
 | aux: Contains the Perl script version.
 |  | output: The Perl script targets this directory for output.
 |  | reciprocal.pl: The Perl script.
 | doc: Documentation.
 |  | lib: Contains KaTeX library for rendering mathematics.
 |  | structures.html: Describes the mathematical structures
 |  |                  used to process sequences.
 |  | architecture.md: The document you're currently reading :).
 | resources
 |  | public: The application compiles into this directory.
 | src: Source code for the web application.
 |  | clj
 |  |  | hybsearch
 |  |  |  | db
 |  |  |  | | collections.clj: Static definitions of collection names.
 |  |  |  | | crud.clj: Create, Read, Update, Delete methods for database.
 |  |  |  | | init.clj: Database init wrapper, ensures that db connection
 |  |  |  | |           is initialized before accessing (note: does not
 |  |  |  | |           yet throw an error if ensure-db fails).
 |  |  |  | api.clj: Server side endpoints for client-server api.
 |  |  |  | core.clj: I think this is used in production builds, definitely
 |  |  |  |           not used in development builds.
 |  |  |  | devserver.clj: Code for launching the server in development mode.
 |  |  |  | server.clj: Ring middleware, routing, and web socket handlers.
 |  | cljs
 |  |  | hybsearch
 |  |  |  | rpc.cljs: Client side endpoints for client-server api.
 |  | hl
 |  |  | hybsearch
 |  |  |  | ui: Custom UI components, defined with the Hoplon
 |  |  |  |     templating language.
 |  |  |  | index.cljs.html: The main page for the application.
 |  |  | main.inc.css: Some basic css that Hoplon includes. I'm pretty sure
 |  |  |               we can just delete this, but I haven't risked it yet.
 |  |
 | .gitignore
 | build.boot: This file contains the Boot build configuration,
 |             including third-party dependencies.
 |README.md
```

##Data Flow
![data flow](./dataflow.png)


The application's data flow is designed to be as unidirectional as possible to make it easier to reason about.

You can think of the server as consisting of two main modules. The first module (on the right in the diagram) has one part that transforms UI data to a datascript representation and pushes it to the client and another part that handles incoming uploads and requests to start or stop processing on a given analysis set.

The second main module (not yet implemented) manages the processing of analysis sets. When the server starts up, no sets are processing. When UI state is pushed to the client, this module is checked to see which are processing, and that state is included in UI state. This module can also inform the first main module that changes have been made during processing. The first main module makes the decision about when to push the new UI state to the client.

The client also consists of two parts. All UI state is stored in DataScript databases. There is currently only one DataScript database, but we might add more to split up different kinds of data pushes (e.g. analysis set info in one, query results in another). When UI data is pushed, the entire database is replaced with a new database created from the new data, and this replacement triggers a UI update. While this seems hilariously inefficient, it turns out to be reasonably performant, and is worth doing because it makes UI state far easier to reason about.

The "User Interface" part of the client contains all of the components for exploring the data in the DataScript database and for sending data (clustal scheme creation form, analysis set creation by uploading a library file, and start/stop processing) to the server.

Notice that all data travels from the server to the DataScript database, from the DataScript database to the user interface, or from the user interface to the server. This unidirectional flow makes the client-server interaction easier to think about.


##Server Architecture
- http kit
- sente websockets
- routing

##Database Architecture
- collection definitions
- indexes (frame-hinge, binomial name, accession number)
- Monger

##Client Architecture (User Interface)
- Hoplon templating language
- Javelin cells
- Datascript

##Processing Strategy
