<script>
import _ from 'lodash';
import ace from 'vue2-ace-editor';
import polyglot from '../src';
import enginesImport from '../src/modules/engines.js'
import global from '../src/modules/global.js'
import JsonTree from 'vue-json-tree'
import VRuntimeTemplate from "v-runtime-template";
import 'brace/theme/chrome';

export default {
	data: ()=> ({
		query: '',
		customField: '',
		replaceAll: false,
		editorOptions: {
			showPrintMargin: false,
			wrap: true,
		},
		engines: enginesImport,
		enginesExpanded: {},
		enginesQuery: {},
		polyglotOptions: {
			groupLines: false,
			groupLinesAlways: true,
			removeNumbering: false,
			preserveNewLines: true,
			replaceWildcards: true,
			transposeLines: true,
			highlighting: true,
			disableLineExpansion: false,
		},
		exampleLast: '',
	}),
	components: {
		editor: ace,
		jsontree: JsonTree,
		VRuntimeTemplate
	},
	methods: {
		clear() {
			this.query = '';
		},
		copyQuery() {
			// Create new element
			var el = document.createElement('textarea');
			// Set value (string to be copied)
			el.value = this.query;
			// Set non-editable to avoid focus and move outside of view
			el.setAttribute('readonly', '');
			el.style = {position: 'absolute', left: '-9999px'};
			document.body.appendChild(el);
			// Select text inside element
			el.select();
			// Copy text to clipboard
			document.execCommand('copy');
			// Remove temporary element
			document.body.removeChild(el);
		},
		copyContent(id) {
			// Create new element
			var el = document.createElement('textarea');
			// Set value (string to be copied)
			el.value = polyglot.translate(this.query, id, {html: false});
			// Set non-editable to avoid focus and move outside of view
			el.setAttribute('readonly', '');
			el.style = {position: 'absolute', left: '-9999px'};
			document.body.appendChild(el);
			// Select text inside element
			el.select();
			// Copy text to clipboard
			document.execCommand('copy');
			// Remove temporary element
			document.body.removeChild(el);
		},
		openGuide() {
			window.open('https://github.com/IEBH/sra-polyglot/blob/master/README.md', '_blank')
		},
		showExample() {
			var chosenExample;
			do {
				chosenExample = _.sample(global.examples);
			} while (this.exampleLast == chosenExample.title)
			this.exampleLast = chosenExample;
			this.query = chosenExample.query;
		},
		toggleExpandEngine(engine) {
			this.$set(this.enginesExpanded, engine.id, !this.enginesExpanded[engine.id]);
		},
		editorInit() { // Ace editor settings
			
			window.ace.config.set('modePath', 'syntax/ace');
		},
		loadTextFromFile(ev) {
			var myFile = ev.target.files[0];
			var reader = new FileReader();
			var _this = this;
			reader.onload = (function(f) {
				return function(e) {
					_this.query = reader.result.replace(/\r/g, '')
				};
			})(myFile);
			reader.readAsText(myFile);
		},
		replaceFields(field, replace_all, offset) {
			if (replace_all) {
				var itemsToReplace = global.variables.no_field_tag.slice(0).reverse(); // Work backwards through items
				for (var x in itemsToReplace) {
					// If original query is surrounded by quotation marks, 2 must be added to offset
					itemsToReplace[x] = (/(\W)/.test(this.query[itemsToReplace[x]]))? itemsToReplace[x] : itemsToReplace[x]+2;
					if (/(\W)/.test(this.query[itemsToReplace[x]]) || typeof this.query[itemsToReplace[x]] === "undefined") {
						this.query = this.query.slice(0, itemsToReplace[x]) + field + this.query.slice(itemsToReplace[x]);
					}
				}
			} else {
				// If original query is surrounded by quotation marks, 2 must be added to offset
				offset = (/(\W)/.test(this.query[offset]))? offset : offset+2;
				if (/(\W)/.test(this.query[offset]) || typeof this.query[offset] === "undefined") {
					this.query = this.query.slice(0, offset) + field + this.query.slice(offset);
				}
			}
		},
	},
	watch: {
		query() {
			_(polyglot.translateAll(this.query, this.polyglotOptions))
				.forEach((query, key) => this.$set(this.enginesQuery, key, query))
		},
	},
};
</script>

<template>
	<div class="container">
		<div v-on:click="openGuide()" class="alert alert-info text-center">
			<div class="pull-left font-xl h1">
				<i class="fa fa-question-circle push-up"></i>
			</div>
			Click here to open user reference guide for Polyglot
		</div>

		<div class="row-fluid">
			<div class="card">
				<div class="card-header">
					Your query
					<div class="pull-right">
						<div>
							<label for="checkbox">Disable line expansion </label>
							<input type="checkbox" id="checkbox" v-model="polyglotOptions.disableLineExpansion">
						</div>
						<a v-on:click="clear()" class="btn btn-sm btn-default"><i class="fa fa-eraser" title="Clear search"></i></a>
						<a v-on:click="copyQuery()" class="btn btn-sm btn-default"><i class="fa fa-clipboard" title="Copy to clipboard"></i></a>
						<a v-on:click="showExample()" class="btn btn-sm btn-default"><i class="fa fa-random" title="Show a random example"></i></a>
					</div>
				</div>
				<div class="card-body p-0">
					<editor
						v-model="query"
						v-on:init="editorInit"
						lang="polyglot"
						theme="chrome"
						width="100%"
						height="380"
						v-bind:options="editorOptions"
					></editor>
				</div>
					<div v-if="!query" v-on:click="showExample()" class="card-footer text-center">
					Type a PubMed or Ovid MEDLINE query in the box above to see its translations
					<span class="text-muted">(or click here to see an example)</span>
				</div>
			</div>
		</div>

		<label class="text-reader">
			<span class="select-button">Import Search From .txt File</span>
			<input type="file" @change="loadTextFromFile">
  		</label>
		
		<hr/>

		<div class="accordion panel-group">
			<div v-for="engine in engines" :key="engine.id" class="card" id="customcard">
				<div class="card-header" v-on:click="toggleExpandEngine(engine)" >
					<a class="accordion-toggle collapsed">
						<i class="fa fa-fw" :class="enginesExpanded[engine.id] ? 'fa-chevron-down' : 'fa-chevron-right'"></i>
						{{engine.title}}
					</a>
					<div class="pull-right">
						<a v-if="engine.id != 'lexicalTreeJSON'" v-on:click.stop="copyContent(engine.id)" class="btn btn-sm btn-default"><i class="fa fa-clipboard" title="Copy to clipboard"></i></a>
					</div>
				</div>
				<div class="card-body collapse" :class="enginesExpanded[engine.id] && 'show'">
					<v-runtime-template class="preview" v-if="enginesQuery[engine.id] && engine.id != 'lexicalTreeJSON' && engine.id != 'mongodb'" :template="'<div>' + enginesQuery[engine.id] + '</div>'" ></v-runtime-template>
					<!-- <pre class="preview" v-html="enginesQuery[engine.id]" v-if="enginesQuery[engine.id] && engine.id != 'lexicalTreeJSON' && engine.id != 'mongodb'"></pre> -->
					<jsontree v-if="enginesQuery[engine.id] && engine.id == 'lexicalTreeJSON'" :data="enginesQuery[engine.id]"></jsontree>
      				<hr>
					<!-- MongoDB not included at this stage -->
				</div>
			</div>
		</div>
	</div>
</template>

<style scoped>
	.text-reader {
		margin: 20px 0px 0px 0px;
	}
	.text-reader > .select-button {
		padding: .5rem;

		color: #426E7B;
		background-color: #D3ECF1; 

		border-radius: .3rem;

		text-align: center;

		-webkit-transition-duration: 0.4s; /* Safari */
  		transition-duration: 0.4s;
	}

	.text-reader > .select-button:hover {
		background-color: #426E7B;
  		color: #D3ECF1;
	}

	.text-reader > input[type="file"] {
		display: none;
	}
</style>
