'use strict';

const Breadcrumb = require("./breadcrumb.js");
const Arguments = require('./arguments.js');

/**
 * @class Action
 * @description Creates a new action
 * @param   {object} config Configuration of the action
 * @param   {string} config.actionName Name of the action, IE the name of the module inside the "actions" directory
 * @param   {object} config.data Object to pass to the called action after being replaced using {@link Arguments.prepareActionArgs}
 */
function Action(config){
    if(is_na(config))
        throw new Error("Can't create Action with null or undefined config.");

    console.log("Creating ACTION with", config);


    var actionName,
        actionConfig,
        processFunction,
        args;

    Object.defineProperties(this, {
        /**
         * @member {string} actionName
         * @memberof Action
         * @public
         * @instance
         */
        actionName: {
            get: function(){
                return actionName;
            },
            set: function(val){
                var actionPath = "../actions/" + val + ".js";
                var handler = require(actionPath);
                if(handler != null && handler.process && typeof handler.process == "function"){
                    actionName = val;
                    processFunction = handler.process;
                    return actionName;
                }
                return undefined;
            }
        },
        /**
         * @member {object} config
         * @memberof Action
         * @public
         * @instance
         */
        config: {
            get: function(){
                return actionConfig;
            },
            set: function(val){
                actionConfig = val;
            }
        },
        /**
         * @member {Arguments} arguments
         * @memberof Action
         * @public
         * @instance
         */
        arguments: {
            get: function(){
                return args;
            },
            set: function(newArgs){
                if(!(newArgs instanceof Arguments))
                    throw new TypeError(`Function "setArguments" expects object of type "Arguments", "${ typeof newArgs }" given.`);
                args = newArgs;
            }
        },
        /**
         * @member {ProcessFunction} processFunction
         * @memberof Action
         * @public
         * @readonly
         * @instance
         */
        processFunction:{
            get: function(){return processFunction;}
        }
    });

    if(is_na(config.action) && is_na(config.actionName == null)){
        throw new Error(`Could not find action for config: ${ JSON.stringify(config) }`);
    }
    this.actionName = config.action || config.actionName;
    this.config = config.data;
    args = new Arguments(config.arguments);
}

/**
 * @function test
 * @memberof Action
 * @description Check if given object is ok to be parsed by {@link Action constructor}
 * @param   {object} obj The object to test
 * @returns {boolean} True if ok, false otherwise
 * @static
 * @public
 * @author Gerkin
 */
Action.test = function(obj){
    return true;
}

/**
 * @method execute
 * @memberof Action
 * @description Runs the specified action. It first compile local arguments with ancestors (see {@link Arguments#brewArguments}), then it replaces {@link Action#config} placeholders with {@link Action#arguments} values, and finally, it calls {@link Action#processFunction}.
 * @param   {Breadcrumb} breadcrumb The actions breadcrumb
 * @param   {Function} callback   Action to call afterwards
 * @returns {undefined} Async
 * @instance
 * @public
 * @author Gerkin
 * @see {@link Arguments.brewArguments}
 */
Action.prototype.execute = function(breadcrumb, callback){
    deployer.log.info(`Starting Action "${ breadcrumb.toString() }" with action name "${ this.actionName }"`);
    /**
     * @snippetStart prepareActionArgs
     */
    return this.arguments.brewArguments((values)=>{
        var compiledArgs = this.arguments.prepareActionArgs(this.config);
        console.log(JSON.stringify(compiledArgs, null, 4)); 
        deployer.log.info(`Ended Action "${ breadcrumb.toString() }" after ${ breadcrumb.getTimer() }ms`);
        //return callback()
        return this.processFunction(compiledArgs, ()=>{
            deployer.log.info(`Starting Action "${ breadcrumb.toString() }" with action name "${ this.actionName }"`);
            callback();
        });
    });
    /**
     * @snippetEnd prepareActionArgs
     */
}
/**
 * @function setArguments
 * @memberof Action
 * @description Prepare {@link Action#arguments} by setting its {@link Arguments#ancestor} for placeholder operations
 * @param   {Arguments} arg The argument object to put as ancestor
 * @instance
 * @public
 * @author Gerkin
 */
Action.prototype.setArguments = function(arg){
    if(!(arg instanceof Arguments))
        throw new TypeError(`Function "setArguments" expects object of type "Arguments", "${ typeof arg }" given.`);
    this.arguments.ancestor = arg;
    return this;
}

module.exports = Action;