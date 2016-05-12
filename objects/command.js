'use strict';

const ActionGroup = require("./actiongroup.js");
const Breadcrumb = require("./breadcrumb.js");
const Arguments = require('./arguments.js');
const Listener = require("./listener.js");

/**
 * Creates a new command
 * @class Command
 * @param   {object}   config Configuration of the command
 * @param   {Command.Type} config.type Type of command
 * @param   {ActionGroup} config.actionGroup Related base action group
 */
class Command{
    constructor ({ awake, command_group,args,actionGroup, eventListeners}){
        if(is_na(arguments[0]))
            throw new Error("Can't create Command with null or undefined config.");

        var _type,
            _actionGroup,
            _commandArgs;

        Object.defineProperties(this, {
            /**
             * @member {Command.Type} type
             * @memberof Command
             * @public
             * @instance
             */
            type: {
                get: function(){
                    return _type;
                },
                set: function(val){
                    if(Object.keys(Command.Type).indexOf(val) != -1){
                        _type = Command.Type[val];
                        return _type;
                    } else if(Object.values(Command.Type).indexOf(val) != -1){
                        _type = val;
                        return _type;
                    } else {
                        return undefined;
                    }
                }
            },
            /**
             * @member {ActionGroup} actionGroup
             * @memberof Command
             * @public
             * @instance
             */
            actionGroup: {
                get: function(){
                    return _actionGroup;
                },
                set: function(val){
                    if(val.constructor.name != "ActionGroup")
                        return undefined;
                    _actionGroup = val;
                    return val;
                    return undefined;
                }
            },
            /**
             * @member {Arguments} commandArgs
             * @memberof Command
             * @public
             * @readonly
             * @instance
             */
            commandArgs: {
                get: function(){return _commandArgs;}
            }
        });

        if(awake === true && (command_group === false || is_na(command_group))){
            this.type = "PERMANENT"
        } else if((awake === false || is_na(awake)) && command_group === true){
            this.type = "MOMENTARY"
        } else {
            throw new Error("Could not resolve Command type: listener or command_group");
        }

        if(args){
            _commandArgs = new Arguments(args);
            //console.log(commandArgs);
        }
        if(this.type === Command.Type.MOMENTARY){
            try{
                this.actionGroup = new ActionGroup(actionGroup);
                //console.log(actionGroup);
            } catch(e){
                throw e;
            }
        } else if(this.type === Command.Type.PERMANENT){
            this.listeners = [];
            for(var i = 0, j = eventListeners.length; i < j; i++){
                this.listeners.push(new Listener(eventListeners[i]));
            }
            deployer.log.error("PERMANENT commands not yet implemented");
        } else {
            throw new Error("Properties not correctly initialized");
        }
    }


    /**
     * @function setArgumentsGlobal
     * @memberof Command
     * @description Prepare {@link Command#commandArgs} by setting its {@link Arguments#ancestor} with projet-wide constants.
     * @param   {Arguments} args The argument object to put as ancestor
     * @instance
     * @public
     * @author Gerkin
     */
    setArgumentsGlobal (args){
        this.commandArgs.ancestor = new Arguments(args);
        return this;
    };
    /**
     * Execute the command: process arguments then triggers {@link Command.actionGroup}
     * @author Gerkin
     * @param {Function} next Function to execute once finished
     */
    execute (next){
        var breadcrumb = new Breadcrumb();
        this.commandArgs.brewArguments((args)=>{
            this.actionGroup.setArguments(this.commandArgs).execute(breadcrumb.startTimer(), next);
        });
    };
}

/**
 * @readonly
 * @enum {number}
 */
Command.Type = {
    PERMANENT: 1,
    MOMENTARY: 2
};

module.exports = Command;