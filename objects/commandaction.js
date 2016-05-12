'use strict';

const Breadcrumb = require("./breadcrumb.js");
const Arguments = require('./arguments.js');
const Action = require('./action.js');

/**
 * @class CommandAction
 * @description Creates a new action
 * @param   {object} config Configuration of the action
 * @param   {string} config.actionName Name of the action, IE the name of the module inside the "actions" directory
 * @param   {object} config.data Object to pass to the called action after being replaced using {@link Arguments.prepareActionArgs}
 */
class CommandAction extends Action{
    constructor ({action, actionName, data, args}){
        if(is_na(arguments[0]))
            throw new Error("Can't create CommandAction with null or undefined config.");
        super();

        var _actionName,
            _actionConfig,
            _processFunction,
            _args;

        Object.defineProperties(this, {
            /**
             * @member {string} actionName
             * @memberof CommandAction
             * @public
             * @instance
             */
            actionName: {
                get: function(){
                    return _actionName;
                },
                set: val=>{
                    var actionPath = "../actions/" + val + ".js";
                    var handler = require(actionPath);
                    if(handler != null && handler.process && typeof handler.process == "function"){
                        _actionName = val;
                        if(this.eventListener)
                            _processFunction = handler.processSingle;
                        else
                            _processFunction = handler.process;
                        if(is_na(_processFunction)){
                            throw new ActionError(`Could not find "${ this.eventListener ? "processSingle" : "process" } for action "${ _actionName }". This action will do nothing`);
                        }
                        return _actionName;
                    }
                    return undefined;
                }
            },
            /**
             * @member {object} config
             * @memberof CommandAction
             * @public
             * @instance
             */
            config: {
                get: function(){
                    return _actionConfig;
                },
                set: function(val){
                    _actionConfig = val;
                }
            },
            /**
             * @member {Arguments} arguments
             * @memberof CommandAction
             * @public
             * @instance
             */
            arguments: {
                get: function(){
                    return _args;
                },
                set: function(newArgs){
                    if(!(newArgs instanceof Arguments))
                        throw new TypeError(`Function "setArguments" expects object of type "Arguments", "${ typeof newArgs }" given.`);
                    _args = newArgs;
                }
            },
            /**
             * @member {ProcessFunction} processFunction
             * @memberof CommandAction
             * @public
             * @readonly
             * @instance
             */
            processFunction:{
                get: function(){return _processFunction;}
            }
        });

        if(is_na(action) && is_na(actionName)){
            throw new Error(`Could not find action for config: ${ JSON.stringify(arguments[0]) }`);
        }
        this.actionName = action || actionName;
        this.config = data;
        this.arguments = new Arguments(args);
    }

    /**
     * @function test
     * @memberof CommandAction
     * @description Check if given object is ok to be parsed by {@link CommandAction constructor}
     * @param   {object} obj The object to test
     * @returns {boolean} True if ok, false otherwise
     * @static
     * @public
     * @author Gerkin
     */
    static test (obj){
        return true;
    }

    /**
     * @method execute
     * @memberof CommandAction
     * @description Runs the specified action. It first compile local arguments with ancestors (see {@link Arguments#brewArguments}), then it replaces {@link CommandAction#config} placeholders with {@link CommandAction#arguments} values, and finally, it calls {@link CommandAction#processFunction}.
     * @param   {Breadcrumb} breadcrumb The actions breadcrumb
     * @param   {Function} callback   CommandAction to call afterwards
     * @returns {undefined} Async
     * @instance
     * @public
     * @author Gerkin
     * @see {@link Arguments.brewArguments}
     */
    execute (breadcrumb, callback){
        breadcrumb.startTimer();
        if(this.eventListener === true){
            throw new ActionError(`Calling "execute" on "CommandAction" should be done only if mode eventListener is disabled.`);
        }

        deployer.log.info(`Starting CommandAction "${ breadcrumb.toString() }" with action name "${ this.actionName }"`);
        /**
         * @snippetStart prepareActionArgs
         */
        return this.arguments.brewArguments((values)=>{
            var compiledArgs = this.arguments.prepareActionArgs(this.config);
            console.log(JSON.stringify(compiledArgs, null, 4)); 
            return this.processFunction(compiledArgs, ()=>{
                deployer.log.info(`Ended CommandAction "${ breadcrumb.toString() }" after ${ breadcrumb.getTimer() }ms`);
                callback();
            });
        });
        /**
         * @snippetEnd prepareActionArgs
         */
    }

    /**
     * @method trigger
     * @memberof CommandAction
     * @description 
     * @param   {Breadcrumb} breadcrumb The actions breadcrumb
     * @param   {string} filepath Filepath of event
     * @param   {Function} callback   CommandAction to call afterwards
     * @returns {undefined} Async
     * @instance
     * @public
     * @author Gerkin
     * @see {@link Arguments.brewArguments}
     */
    trigger (breadcrumb, filepath, callback){
        breadcrumb.startTimer();
        if(this.eventListener === false){
            throw new ActionError(`Calling "trigger" on "CommandAction" should be done only if mode eventListener is enabled.`);
        }

        deployer.log.info(`Starting EventHandler "${ breadcrumb.toString() }" with handler "${ this.actionName }"`);
        return this.arguments.brewArguments((values)=>{
            var compiledArgs = this.arguments.prepareActionArgs(this.config);
            console.log(JSON.stringify(compiledArgs, null, 4)); 
            return this.processFunction(compiledArgs,filepath, ()=>{
                deployer.log.info(`Ended EventHandler "${ breadcrumb.toString() }" after ${ breadcrumb.getTimer() }ms`);
                callback();
            });
        });
    }

    /**
     * @function setArguments
     * @memberof CommandAction
     * @description Prepare {@link CommandAction#arguments} by setting its {@link Arguments#ancestor} for placeholder operations
     * @param   {Arguments} arg The argument object to put as ancestor
     * @instance
     * @public
     * @author Gerkin
     */
    setArguments (arg){
        if(!(arg instanceof Arguments))
            throw new TypeError(`Function "setArguments" expects object of type "Arguments", "${ typeof arg }" given.`);
        this.arguments.ancestor = arg;
        return this;
    }
}

class ActionError extends Error{
    constructor(message = "Error with an action!"){
        super(); 
        this.name = "ActionError";
        this.message = message;
    }
}

module.exports = CommandAction;