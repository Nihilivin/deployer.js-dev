/**
 * @file Generates the documentation of javascript
 * @description Generates the documentation of javascript
 *
 * @author Gerkin
 * @copyright 2016 GerkinDevelopment
 * @license http://www.gnu.org/licenses/gpl-3.0.en.html GPL v3
 * @package deployer.js
 *
 * @version 0.4.0
 */

const randomstring = require("randomstring");

/**
 * handles generation of javascript documentation from {@link deployer}
 * @module actions/minify
 * @requires fs
 * @requires randomstring
 */
module.exports = {
	/**
     * Process the generation operation with the config provided
	 * @method
     * @param   {object} config Options to explain to the module how to behave
     * @param   {callback} Function to call at the end of action
     * @returns {undefined}
     */
	process: function(config, cb){
		var filesArray = filesFromSelectors(config.selection);
		var l = filesArray.length;
		if(l == 0){
			deployer.log.info("JSDOC => No files to document with jsdoc");
			return cb();
		}
		for(var i = 0; i < l; i++){
			filesArray[i] = path.resolve(".", filesArray[i]);
		}
		var pathobj = {base: "path"};
		if(config.typepath)
			pathobj.type = config.typepath;
		var root = {
			tags: {
				allowUnknownTags: true,
				dictionnaries: [
					"jsdoc",
					"closure"
				]
			},
			source: {
				include: filesArray
			},
			"plugins": config.plugins ? config.plugins : [],
			"templates": {
				"cleverLinks": false,
				"monospaceLinks": false
			},
			"opts": {
				"template": "templates/default",  // same as -t templates/default
				"encoding": "utf8",               // same as -e utf8
				"destination": config.destinationPath,          // same as -d ./out/
				"recurse": true,                  // same as -r
			}
		};
		console.log("DestinationPath ",config.destinationPath);
		if(config.template)
			root.opts.template = "templates/" + config.template;
		if(config.tutorials)
			root.opts.tutorials = path.resolve(".", config.tutorials); // same as -u path/to/tutorials
		var targetName = "jsdoc-" + randomstring.generate(15) + "-config.json";
		var targetPath = path.resolve("/tmp", targetName);
		fs.writeFile(targetPath, JSON.stringify(root, null, 4), function(cb2){
			var args = [];
			if(config.private){
				args.push("-p");
			}
			args.push("--verbose");
			args.push("-c");
			args.push(targetPath);
			deployer.log.info("JSDOC => Command: \"" + args + "\"");
			var process = child_process.spawn("jsdoc", args);
			process.stdout.on("data", function(data){
				deployer.log.verbose("JSDOC =>", data.toString("UTF-8").slice(0,-1));
			});
			process.stderr.on("data", function(data){
				deployer.log.error("JSDOC =>", data.toString("UTF-8").slice(0,-1));
			});
			process.on("exit", function(exitCode){
				deployer.log.info("JSDOC => Process JSDOC exited with code " + exitCode);
				if(!deployer.config.dirty){
					fs.unlink(targetPath, function(err){
						if(err)
							deployer.warn("JSDOC => Could not unlink config file " + targetPath);
						cb();
					});
				} else {
					cb();
				}
			})
		});
	}
}