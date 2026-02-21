'use server';
"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditCandidate = auditCandidate;
var ai_1 = require("ai");
var ai_orchestrator_1 = require("../lib/ai-orchestrator");
var github_analyzer_1 = require("../lib/tools/github-analyzer");
function auditCandidate(resumeContext, githubUrl, githubMarkdownContent, jobDescription) {
    return __awaiter(this, void 0, void 0, function () {
        var systemPrompt, userPrompt, _a, text, toolCalls, toolResults, context, analysisResult, payload, discrepancies, interviewQuestions, lines, currentSection, _i, lines_1, line, lowerLine, cleanLine;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    systemPrompt = "\n    ".concat(github_analyzer_1.SCOUT_PROMPT, "\n\n    Instruction Additions:\n    - You MUST use the analyzeCodebase tool to extract jdMatchScore and signatureMatch based on the Job Description.\n\n    Return your findings in a structured format:\n    - discrepancies: Array of strings identifying lies, gaps or contradictions.\n    - interviewQuestions: Array of strings with specific technical questions to pressure-test the candidate on the identified gaps.\n  ");
                    userPrompt = "\n    Candidate Resume:\n    ".concat(JSON.stringify(resumeContext, null, 2), "\n    \n    GitHub Repository URL: ").concat(githubUrl, "\n    \n    Job Description:\n    ").concat(jobDescription, "\n    \n    Please analyze the repository using the provided tool and compare it with the resume and job description.\n  ");
                    return [4 /*yield*/, (0, ai_1.generateText)({
                            model: ai_orchestrator_1.model,
                            system: systemPrompt,
                            prompt: userPrompt,
                            tools: {
                                analyzeCodebase: github_analyzer_1.analyzeCodebase,
                            },
                            maxSteps: 2, // Allow the model to call the tool and then generate the final response
                        })];
                case 1:
                    _a = _b.sent(), text = _a.text, toolCalls = _a.toolCalls, toolResults = _a.toolResults;
                    context = (0, ai_orchestrator_1.getInitialContext)();
                    context.resume = resumeContext;
                    // Extract github data from tool results
                    if (toolResults && toolResults.length > 0) {
                        analysisResult = toolResults.find(function (r) { return r.toolName === 'analyzeCodebase'; });
                        if (analysisResult && analysisResult.result) {
                            payload = analysisResult.result;
                            context.githubData.push(payload);
                            if (payload.jdMatchScore !== undefined) {
                                context.jdMatchScore = payload.jdMatchScore;
                            }
                            if (payload.signatureMatch) {
                                context.signatureMatch = payload.signatureMatch;
                            }
                        }
                    }
                    discrepancies = [];
                    interviewQuestions = [];
                    lines = text.split('\n');
                    currentSection = '';
                    for (_i = 0, lines_1 = lines; _i < lines_1.length; _i++) {
                        line = lines_1[_i];
                        lowerLine = line.toLowerCase();
                        if (lowerLine.includes('discrepanc') || lowerLine.includes('gap') || lowerLine.includes('contradiction')) {
                            currentSection = 'discrepancies';
                            continue;
                        }
                        else if (lowerLine.includes('question') || lowerLine.includes('interview')) {
                            currentSection = 'questions';
                            continue;
                        }
                        if (line.trim().startsWith('-') || line.trim().match(/^\d+\./)) {
                            cleanLine = line.replace(/^-\s*/, '').replace(/^\d+\.\s*/, '').trim();
                            if (cleanLine) {
                                if (currentSection === 'discrepancies') {
                                    discrepancies.push(cleanLine);
                                }
                                else if (currentSection === 'questions') {
                                    interviewQuestions.push(cleanLine);
                                }
                            }
                        }
                    }
                    context.discrepancies = discrepancies.length > 0 ? discrepancies : ['Model analysis complete. Review raw text for details if lists are empty: ' + text.substring(0, 100) + '...'];
                    return [2 /*return*/, __assign(__assign({}, context), { interviewQuestions: interviewQuestions.length > 0 ? interviewQuestions : ['Could not parse specific questions. Please ask the candidate to walk through their codebase.'] })];
            }
        });
    });
}
