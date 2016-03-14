var Game = require( './Game.js' );

var readline = require( 'readline' );
var fs       = require( 'fs' );
var path     = require( 'path' );

/* the name is terrible; this might could be part of the Game objects...
 * would want to discuss symantics here with the team
 */
var GamePlayer = function( filePath, verbose ) {
    this.filePath = path.join( __dirname, filePath );

    this.verbose = typeof verbose !== 'undefined'
                    ? verbose
                    : false;
}

GamePlayer.prototype = {
    constructor: GamePlayer

    ,_getReaderHandle: function() {
        try {
            return readline.createInterface({
                input: fs.createReadStream( this.filePath )
            });
        }
        catch( e ) {
            /* TODO: out to stderr */
            console.log( "ERROR: " + e.message );
        }
        return false;
    }

    ,_parseLine: function( line, context ) {
        
        if( context.verbose ) {
            console.log( "\nNew game" );
        }

        var game        = new Game();
        var pointNumber = 0;

        var i = 0;
        while( i < line.length && ! game.gameOver() ) {
            try {
                var playerId = parseInt( line.charAt( i ) );
                
                game.winPoint( playerId );
                pointNumber++;

                if( context.verbose ) {
                    console.log( "point player " + playerId + "! score is " + game.getScore()
                        + (game.isGamePoint() ? " Game point player " + game.gamePoint : "") 
                        + (game.deuce ? " \u00E9galit\u00E9" : "" ) 
                    );
                }
                i++;
            }
            catch( e ) {
                console.log( 'ERROR: ' + e );
                return null;
            }
        }
        
        if( game.winner !== false ) {
            console.log( 'WIN player ' + game.winner + ' on point ' + pointNumber ); 
        }
        else {
            console.log( "TIE - that's unusual!" );
        }

        return game.winner;
    }

    ,_printResult( wins, errors ) {

        /* output requirements:
on the final line, print the player number with the most wins, followed by the number of wins more than their opponent, followed by the number of errors. For example, if player 0 won 5 games and player 1 won 7 games, and there were no errors, print "120". If the match is a tie print "X" for the player number, for example, "X01".
        */
        var out    = "";
        var winDif = wins[0] - wins[1]; 
        
        if( winDif === 0 ) {
            out = 'X';
        }
        else if( winDif > 0 ) {
            out = '0';
        }
        else {
            out = '1';
        }

        out = out + Math.abs( winDif ).toString() + errors.toString();
        console.log( out );
        
    }

    ,play: function() {
        var readerHandle = this._getReaderHandle();

        if( !readerHandle ) {
            console.log( "Couldn't open " + this.filePath + " for writing" );
            return 1;
        }

        var context = this;
        
        var wins   = [ 0, 0 ];
        var errors = 0;
        
        readerHandle.on( 'close', function() {
            context._printResult( wins, errors );
        } );

        readerHandle.on( 'line', function( line ) {
            /* FIXME: - overly complicated return semantics, need
             * to make something simpler and more obvious
             * returns 0 or 1 - id of winner
             * returns false  - no winner
             * returns null   - error
             */
            var winner  = context._parseLine( line, context );
            
            if( winner === null ) {
                errors++;
            }
            else if( winner !== false ) {
                wins[ winner ]++;
            }

            /* TODO: handle winner semantics in terms of sets and matches :) */
        } );

    }
}

module.exports = GamePlayer;

function main() {
    /* FIXME: file path should be command line arg */
    var player = new GamePlayer( './tennisinput.txt', false );
    player.play();
}

if (require.main === module) {
    main();
}

