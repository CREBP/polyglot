import tools from '../tools.js'
import _ from 'lodash';

export default {
    id: 'wos',
    title: 'Web of Science',
    aliases: ['webofscience', 'w', 'wos', 'websci'],

    /**
    * Compile a tree structure to Web of Science output
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
            {subject: /\?/g, value: '$'},
            {subject: /\$/g, value: '*'},
            {subject: /#/g, value: tools.createTooltip("*", "No Single Wildcard for WoS", "highlight")},
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
                            buffer += tools.quotePhrase(branch, 'wos', settings.highlighting);
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
                            buffer += 'NEAR/' + branch.proximity;
                            break;
                        case 'mesh':
                            if (settings.highlighting) {
                                buffer += tools.createTooltip(tools.quotePhrase(branch, 'wos', settings.highlighting),
                                                                        "Web of Science does not support MeSH terms")
                            } else {
                                buffer += tools.quotePhrase(branch, 'wos');
                            }
                            break;
                        case 'meshMajor':
                            if (settings.highlighting) {
                                buffer += tools.createTooltip(tools.quotePhrase(branch, 'wos', settings.highlighting),
                                                                        "Web of Science does not support MeSH terms")
                            } else {
                                buffer += tools.quotePhrase(branch, 'wos');
                            }
                            break;
                        case 'raw':
                            buffer += branch.content;
                            break;
                        case 'template':
                            buffer += tools.resolveTemplate(branch.content, 'wos');
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
        action: 'http://apps.webofknowledge.com.ezproxy.bond.edu.au/UA_GeneralSearch.do',
        fields: {
            fieldCount: '1',
            action: 'search',
            product: 'UA',
            search_mode: 'GeneralSearch',
            SID: 'W15WDD6M2xkKPbfGfGY',
            max_field_count: '25',
            max_field_notice: 'Notice: You cannot add another field.',
            input_invalid_notice: 'Search Error: Please enter a search term.',
            exp_notice: 'Search Error: Patent search term could be found in more than one family (unique patent number required for Expand option) ',
            input_invalid_notice_limits: ' <br/>Note: Fields displayed in scrolling boxes must be combined with at least one other search field.',
            sa_params: "UA||W15WDD6M2xkKPbfGfGY|http://apps.webofknowledge.com.ezproxy.bond.edu.au|'",
            formUpdated: 'true',
            'value(input1)': query,
            'value(select1)': 'TS',
            x: '798',
            y: '311',
            'value(hidInput1)': null,
            limitStatus: 'collapsed',
            ss_lemmatization: 'On',
            ss_spellchecking: 'Suggest',
            SinceLastVisit_UTC: null,
            SinceLastVisit_DATE: null,
            period: 'Range Selection',
            range: 'ALL',
            startYear: '1900',
            endYear: (new Date()).getYear(),
            update_back2search_link_param: 'yes',
            ssStatus: 'display:none',
            ss_showsuggestions: 'ON',
            ss_query_language: 'auto',
            ss_numDefaultGeneralSearchFields: '1',
            rs_sort_by: 'PY.D;LD.D;SO.A;VL.D;PG.A;AU.A',
        },
    }),
    openTerms: 'any search box',
}