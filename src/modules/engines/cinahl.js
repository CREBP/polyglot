import tools from '../tools.js'
import _ from 'lodash';

export default {
    id: 'cinahl',
    title: 'CINAHL',
    aliases: ['cinahl', 'ci', 'cnal'],

    /**
    * Compile a tree structure to CINAHL output
    * @param {array} tree The parsed tree to process
    * @param {Object} [options] Optional options to use when compiling
    * @param {boolean} [options.replaceWildcards=true] Whether to replace wildcard characters (usually '?' or '$') within phrase nodes with this engines equivelent
    * @return {string} The compiled output
    */
    compile: (tree, options) => {
        var settings = _.defaults(options, {
            replaceWildcards: true,
        });

        // Apply wildcard replacements
        if (settings.replaceWildcards) tools.replaceContent(tree, ['phrase'], [
            {subject: /#/g, value: tools.createTooltip("*", "No Single Wildcard for Cinahl", "highlight")},
            {subject: /\?/g, value: '#'},
            {subject: /\$/g, value: '*'},
        ]);

        var compileWalker = tree =>
            tree
                .map((branch, branchIndex) => {
                    var buffer = '';
                    switch (branch.type) {
                        case 'line':
                            buffer += compileWalker(branch.nodes);
                            break;
                        case 'group':
                            buffer += '(' + compileWalker(branch.nodes) + ')';
                            break;
                        case 'ref':
                            var node;
                            if(settings.disableLineExpansion) {
                                buffer += branch.ref
                            } else {
                                var node;
                                for (node in branch.nodes) {
                                    if (node == 0) {
                                        buffer += '(' + compileWalker(branch.nodes[node]) + ')';
                                    } else {
                                        buffer += ' ' + branch.cond + ' (' + compileWalker(branch.nodes[node]) + ')';
                                    }	
                                }
                            }
                            break;
                        case 'phrase':
                            if (branch.field && (branch.field == 'title+abstract' || branch.field == 'title+abstract+tw')) {
                                buffer +=
                                    'TI ' + tools.quotePhrase(branch, 'cinahl', settings.highlighting) +
                                    ' OR ' +
                                    'AB ' + tools.quotePhrase(branch, 'cinahl', settings.highlighting);
                            } else if (branch.field) {
                                buffer += _.trimStart(
                                    (
                                        branch.field == 'title' ? 'TI' :
                                        branch.field == 'abstract' ? 'AB' :
                                        branch.field == 'floatingSubheading' ? 'MW' :
                                        branch.field == 'publicationType' ? 'PT' :
                                        branch.field == 'substance' ? 'MW' :
                                        ''
                                    )
                                    + ' ' + tools.quotePhrase(branch, 'cinahl', settings.highlighting)
                                );

                            } else {
                                if (settings.highlighting) {
                                    buffer += tools.createPopover(tools.quotePhrase(branch, 'cinahl', settings.highlighting), branch.offset + branch.content.length);
                                } else {
                                    buffer += tools.quotePhrase(branch, 'cinahl', settings.highlighting);
                                }
                            }
                            break;
                        case 'joinAnd':
                            buffer += 'AND';
                            break;
                        case 'joinOr':
                            buffer += 'OR';
                            break;
                        case 'joinNot':
                            buffer += 'NOT';
                            break;
                        case 'joinNear':
                            buffer += 'N' + branch.proximity;
                            break;
                        case 'mesh':
                            if (settings.highlighting) {
                                buffer += tools.createTooltip('<font color="blue">' + '(MH "' + branch.content + (branch.recurse ? '+' : '') + '")</font>',
                                                                        "Polyglot does not translate subject terms (e.g Emtree to MeSH), this needs to be done manually")
                            } else {
                                buffer += '(MH "' + branch.content + (branch.recurse ? '+' : '') + '")';
                            }
                            break;
                        case 'meshMajor':
                            if (settings.highlighting) {
                                buffer += tools.createTooltip('<font color="blue">' + '(MM "' + branch.content + (branch.recurse ? '+' : '') + '")</font>',
                                                                        "Polyglot does not translate subject terms (e.g Emtree to MeSH), this needs to be done manually")
                            } else {
                                buffer += '(MM "' + branch.content + (branch.recurse ? '+' : '') + '")';
                            }
                            break;
                        case 'raw':
                            buffer += branch.content;
                            break;
                        case 'template':
                            buffer += tools.resolveTemplate(branch.content, 'cinahl');
                            break;
                        case 'comment':
                            // Do nothing
                            break;
                        default:
                            throw new Error('Unsupported object tree type: ' + branch.type);
                    }

                    return buffer
                        // Add spacing provided... its not a raw buffer or the last entity within the structure
                        + (
                            branch.type == 'raw' || // Its not a raw node
                            branch.type == 'line' || // Its not a line node
                            branchIndex == tree.length-1 || // Its not the last item in the sequence
                            (branchIndex < tree.length-1 && tree[branchIndex+1] && tree[branchIndex+1].type && tree[branchIndex+1].type == 'raw')
                            ? '' : ' '
                        );
                })
                .join('');
        return compileWalker(tree);
    },
    open: query => ({
        method: 'POST',
        action: 'http://web.a.ebscohost.com.ezproxy.bond.edu.au/ehost/resultsadvanced',
        fields: {
            bquery: query,
        },
    }),
    openTerms: 'any search box',
}