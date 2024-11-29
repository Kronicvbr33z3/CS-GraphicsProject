class Keys {
    constructor() {
        this.keys_down = {}
    }

    /**
     * Register a keyboard listener and create a Keys object that 
     * will be updated by it.
     * 
     * @returns Keys
     */
    static start_listening() {
        let keys = new Keys();

        addEventListener( 'keydown', function( ev ) {
            // Prevent default behavior for arrow keys and space
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(ev.code)) {
                ev.preventDefault();
            }
            
            if( typeof ev.code === 'string' ) {
                keys.keys_down[ ev.code ] = true;
            }
        } );

        addEventListener( 'keyup', function( ev ) {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(ev.code)) {
                ev.preventDefault();
            }
            
            if( typeof ev.code === 'string' ) {
                keys.keys_down[ ev.code ] = false;
            }
        } );

        return keys;
    }

    is_key_down( code ) {
        return !!this.keys_down[ code ];
    }

    is_key_up( code ) {
        return !this.keys_down[ code ];
    }

    keys_down_list() {
        return Object.entries(this.keys_down)
            .filter( kv => kv[1] /* the value */ )
            .map( kv => kv[0] /* the key */ );

        // the code above is equivalent to this:
        /*
        let ret = [];

        for( const [key, value] of Object.entries(this.keys_down) ) {
            if( value ) {
                ret.push( key );
            }
        }

        return ret;
        */

        // notice how much more terse the functional is. It's easier to read, too, 
        // if you're comfortable with functional programming.
    }
}
