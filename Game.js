function Game( score ) {
    
    /* false or player id */
    this.gamePoint = false;
    
    this.deuce     = false;
    this.winner    = false;

    /* store score position, not actual score */
    this.scorePos   = [0, 0];
    this.gameScores = [ 0, 15, 30, 40 ];
    this.maxScorePos = this.gameScores.length - 1 /* because programmer brain 
                                                   * says the rules could 
                                                   * theoretically change... ;) */
    /* todo: player names, date/time, etc */

    if( typeof score !== 'undefined' ) {
        this.setScore( score );
    }
};

Game.prototype = {
    constructor: Game
   
    /* use this instead of testing gamePoint 
     * to ensure type comparison
     */
    ,isGamePoint: function() {
        return this.gamePoint !== false;
    }
    
    /* use this instead of winner to ensure
     * type comparison
     */
    ,gameOver: function() {
        return this.winner !== false;
    }

    ,setScore: function( score ) {
        if( !Array.isArray( score ) || score.length != 2 ) {
            throw "score must be array with two elements";
        }
       
        /* reset state first */
        this.scorePos  = [0, 0];
        this.winner    = false;
        this.deuce     = false;
        this.gamePoint = false;

        for( var i=0; i<=1; i++ ) {
            var curScore = score[i];

            if( curScore === 'W' ) {
                if( this.gameOver() ) {
                    throw "trying to set score of completed game. are both score elements W?";
                } 
                
                this.scorePos[i] = 'W';
                this.winner = i;
            }
            else if( curScore === 'A' ) {
                if( this.gamePoint() ) {
                    throw "trying to set advantage on game point. are oth score elements A?";
                }
                this.scorePos[i] = 'A';
                this.gamePoint = i;
            }
            else {
                curScore = parseInt( curScore );
                if( ! this.gameScores.inArray( curScore ) ) {
                    throw "I don't know what to do with score value " + curScore;
                }
                this.scorePos[i] = this.gameScores.indexOf( curScore );
            }
        }

        var posOne = this.scorePos[0];
        var posTwo = this.scorePos[1];
    
        /* setting game point or deuce assumes other 
         * error handling is working correctly
         */
        if( posOne === this.maxScorePos && posTwo === this.maxScorePos ) {
            this.deuce = true; /* this might not be technically deuce the first time it happens in a game? */
        } 
        else if( posOne === this.maxScorePos || posOne === 'A' ) {
            this.gamePoint = 0; /* this is redundant for the advantage case above,
                                 * but it feels really weird to not have that
                                 * in the conditional anyway 
                                 */
        }
        else if( posTwo === this.maxScorePos || posTwo === 'A' ) {
            this.gamePoint = 1;
        }
    }

    ,getScore: function() {
        var score = [];
        
        /* integer if numeric score, otherwise winner or advantage */
        for( var i=0; i<=1; i++ ) {
            var scorePos = this.scorePos[i];
            score[i] = Number.isInteger( scorePos )
                        ? this.gameScores[ scorePos ].toString()
                        : scorePos;
        }

        return score;
    }

    /* wrapper for logic shared between multiple scoring
     * scenarios; assumes all handling of winning, égalité,
     * etc has been previously managed and this *just* 
     * increments the point
     */
    ,_scorePoint: function( playerIndex ) {
        this.scorePos[ playerIndex ]++; 
    
        if( this.scorePos[0] === this.maxScorePos && this.scorePos[1] === this.maxScorePos ) {
            
            this.deuce     = true;
            this.gamePoint = false;
        }
        else {
            this.gamePoint = this.scorePos[0] === this.maxScorePos
                ? 0
                : this.scorePos[1] === this.maxScorePos
                    ? 1
                    : false;
            
            /* probably not necessary */
            this.deuce = false;
        }
    }

    ,winPoint: function( playerIndex ) {
        if( this.gameOver() ) {
            throw "Can't win a point if the game is over"; 
        }
        
        if( playerIndex !== 0 && playerIndex !== 1 ) {
            throw "Invalid player id " + playerIndex;
        }

        if( this.isGamePoint() ) {
            if( this.gamePoint === playerIndex ) {
                
                this.scorePos[ playerIndex ] = 'W';
                
                this.winner    = playerIndex;
                this.deuce     = false;
                this.gamePoint = false;
            }
            else {
                /* if the other player had advantage, that needs reset to 40 */
                this.scorePos[ playerIndex === 0 ? 1 : 0 ] = this.maxScorePos;
                
                /* if cur player's score is max score, then score had been 40/A
                 * and in that case, *this* player's score is unchanged 
                 */
                if( this.scorePos[ playerIndex ] !== this.maxScorePos ) {
                    this._scorePoint( playerIndex );
                }
                
                /* it's still game point for the other player if this player's 
                 * score is not at 40, eg 15-40 to 30-40; but if the scores
                 * are now even (where 40 40 is the only possibility) then it's 
                 * égalité and not game point
                 */
                if( this.scorePos[ playerIndex ] === this.maxScorePos ) {
                    this.deuce     = true;
                    this.gamePoint = false;
                }
            }
        }
        else if( this.deuce ) {
             this.scorePos[ playerIndex ] = 'A';
             
             this.deuce     = false;
             this.gamePoint = playerIndex;
        }
        else {
            this._scorePoint( playerIndex );
        }
     
        return this.getScore(); 
    } 
}

function assert(score, expectedScore, description) {
    if (Array.isArray(score) && Array.isArray(expectedScore)) {
        if (score.length !== expectedScore.length) {
            console.log('FAIL TEST: ' + description);
            return false;
        }
        if (score[0] !== expectedScore[0] || score[1] !== expectedScore[1]) {
            console.log('FAIL TEST: ' + description);
            return false;
        }
    } else if (score !== expectedScore) {
        console.log('FAIL TEST: ' + description);
        return false;
    }

    console.log('PASS TEST: ' + description);
    return true;
}

function test() {
    
    var testGame = new Game();
    assert( testGame.getScore(), ['0', '0'], 'initial score is zero' );
    
    testGame.winPoint(0);
    assert( testGame.getScore(), ['15', '0'], 'score is fifteen love' );

    testGame.winPoint(1);
    assert( testGame.getScore(), ['15', '15'], 'score is fifteen all' );

    testGame.winPoint(0); /* 30 15 */
    testGame.winPoint(1); /* 30 30 */
    testGame.winPoint(0); /* 40 30 */
    assert( testGame.getScore(), ['40', '30'], 'score is 40 30' );
    assert( testGame.gamePoint, 0, 'game point player 0' );

    testGame.winPoint(1); /* 40 40 */
    assert( testGame.getScore(), ['40', '40'], "\u00E9galit\u00E9" );
    assert( testGame.gamePoint, false, 'no longer game point');
    assert( testGame.deuce, true, 'deuce set true');

    testGame.winPoint(1);
    assert( testGame.getScore(), ['40', 'A'], 'advantage player 1' );
    assert( testGame.gamePoint, 1, 'game point player 1' );
    assert( testGame.deuce, false, 'deuce set false');

    testGame.winPoint(0);
    assert( testGame.getScore(), ['40', '40'], "\u00E9galit\u00E9" );
    assert( testGame.gamePoint, false, 'no longer game point');
    assert( testGame.deuce, true, 'deuce set true');

    testGame.winPoint(0);
    assert( testGame.getScore(), ['A', '40'], "advantage player " );
    assert( testGame.gameOver(), false, "the game is not over" );
    assert( testGame.gamePoint, 0, "game point player 0" );

    testGame.winPoint(0);
    assert( testGame.getScore(), ['W', '40'], "player 0 wins" );
    assert( testGame.gameOver(), true, "the game is over" );

    /* test doughnut game */
    testGame = new Game();
    testGame.winPoint(0); /* 15 0 */
    testGame.winPoint(0); /* 30 0 */
    testGame.winPoint(0); /* 40 0 */
    assert( testGame.gamePoint, 0, "game point player 0 dougnut" );
    
    testGame.winPoint(0);
    assert( testGame.getScore(), ['W', '0'], "player 0 blanks opponent" );
}

module.exports = Game;

if (require.main === module) {
    test();
}

//test();
