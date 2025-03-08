import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Card } from "../components/ui/card";
import { motion } from "framer-motion";
import { Mail, Users, Award, CheckCircle2, XCircle, Trophy, ChevronDown, ChevronUp, Edit2, Save, Plus, Minus } from 'lucide-react';
import Navbar from '../components/Navbar';

// Dummy data
const initialMockData = {
  students: [
    {
      id: "1",
      name: "John Doe",
      score: 85,   
      answers: ["A", "B", "C", "D", "A", "B", "C", "D", "A", "B", "C", "D", "A", "B", "C"],
    },
    {
      id: "2",
      name: "Jane Smith",
      score: 75,
      answers: ["A", "B", "C", "D", "B", "B", "C", "A", "A", "B", "A", "B", "C", "D", "A"],
    },
    {
      id: "3",
      name: "Bob Johnson",
      score: 55,
      answers: ["B", "B", "C", "D", "A", "A", "C", "D", "B", "B", "B", "C", "D", "A", "A"],
    },
  ],
  answerKey: {
    answers: ["A", "B", "C", "D", "A", "B", "C", "D", "A", "B", "C", "D", "A", "B", "C"],
    totalQuestions: 15,
  },
};

const INITIAL_ANSWERS_SHOWN = 10;
const ANSWER_OPTIONS = ["A", "B", "C", "D"];
const MIN_QUESTIONS = 5;
const MAX_QUESTIONS = 50;

export default function OMRResults() {
  const [data, setData] = useState(initialMockData);
  const [emailSent, setEmailSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [showAllAnswers, setShowAllAnswers] = useState(false);
  const [editingAnswerKey, setEditingAnswerKey] = useState(false);
  const [tempAnswerKey, setTempAnswerKey] = useState([...data.answerKey.answers]);
  
  // Calculate scores based on current answer key
  const calculateScore = (studentAnswers: string[], answerKey: string[]) => {
    const correctAnswers = studentAnswers.reduce((acc, answer, index) => {
      return acc + (answer === answerKey[index] ? 1 : 0);
    }, 0);
    return Math.round((correctAnswers / answerKey.length) * 100);
  };

  // Sort students by score to determine ranks
  const students = [...data.students]
    .map(student => ({
      ...student,
      score: calculateScore(student.answers, data.answerKey.answers)
    }))
    .sort((a, b) => b.score - a.score);

  const sendResultsByEmail = async () => {
    try {
      setSending(true);
      await new Promise(resolve => setTimeout(resolve, 1500));
      setEmailSent(true);
    } catch (error) {
      console.error('Failed to send email:', error);
    } finally {
      setSending(false);
    }
  };

  const getRankColor = (rank: number) => {
    switch(rank) {
      case 1: return 'text-yellow-600';
      case 2: return 'text-gray-600';
      case 3: return 'text-amber-700';
      default: return 'text-blue-600';
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank <= 3) {
      return <Trophy className={`h-5 w-5 mr-1 ${getRankColor(rank)}`} />;
    }
    return null;
  };

  const handleAnswerKeyChange = (index: number, value: string) => {
    const newAnswerKey = [...tempAnswerKey];
    newAnswerKey[index] = value;
    setTempAnswerKey(newAnswerKey);
  };

  const saveAnswerKey = () => {
    setData(prev => ({
      ...prev,
      answerKey: {
        ...prev.answerKey,
        answers: tempAnswerKey
      }
    }));
    setEditingAnswerKey(false);
  };

  const adjustQuestionCount = (increment: boolean) => {
    const newCount = increment 
      ? Math.min(data.answerKey.totalQuestions + 1, MAX_QUESTIONS)
      : Math.max(data.answerKey.totalQuestions - 1, MIN_QUESTIONS);

    const newAnswers = increment
      ? [...data.answerKey.answers, ANSWER_OPTIONS[0]]
      : data.answerKey.answers.slice(0, -1);

    setData(prev => ({
      ...prev,
      answerKey: {
        answers: newAnswers,
        totalQuestions: newCount
      },
      students: prev.students.map(student => ({
        ...student,
        answers: increment
          ? [...student.answers, ANSWER_OPTIONS[0]]
          : student.answers.slice(0, -1)
      }))
    }));
    setTempAnswerKey(newAnswers);
  };

  const toggleAnswersView = () => {
    setShowAllAnswers(!showAllAnswers);
  };

  const visibleAnswers = showAllAnswers 
    ? data.answerKey.answers 
    : data.answerKey.answers.slice(0, INITIAL_ANSWERS_SHOWN);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              OMR Results
            </h1>
            <button
              onClick={sendResultsByEmail}
              disabled={sending || emailSent}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                emailSent
                  ? 'bg-green-500 text-white cursor-not-allowed'
                  : sending
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:opacity-90'
              }`}
            >
              <Mail className="h-5 w-5" />
              <span>
                {emailSent
                  ? 'Results Sent!'
                  : sending
                  ? 'Sending...'
                  : 'Email Results'}
              </span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="p-6 bg-white rounded-xl shadow-lg">
              <div className="flex items-center space-x-4">
                <Users className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-500">Total Students</p>
                  <p className="text-2xl font-bold">{students.length}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-white rounded-xl shadow-lg">
              <div className="flex items-center space-x-4">
                <Award className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-500">Average Score</p>
                  <p className="text-2xl font-bold">
                    {(students.reduce((acc, student) => acc + student.score, 0) / students.length).toFixed(2)}%
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-white rounded-xl shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-500">Total Questions</p>
                    <p className="text-2xl font-bold">{data.answerKey.totalQuestions}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => adjustQuestionCount(false)}
                    disabled={data.answerKey.totalQuestions <= MIN_QUESTIONS}
                    className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => adjustQuestionCount(true)}
                    disabled={data.answerKey.totalQuestions >= MAX_QUESTIONS}
                    className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </Card>
          </div>

          <Card className="mb-8 p-6 bg-white rounded-xl shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Answer Key</h2>
              <div className="flex space-x-4">
                {data.answerKey.answers.length > INITIAL_ANSWERS_SHOWN && (
                  <button
                    onClick={toggleAnswersView}
                    className="flex items-center space-x-1 text-purple-600 hover:text-purple-700 transition-colors"
                  >
                    <span>{showAllAnswers ? 'Show Less' : 'Show All'}</span>
                    {showAllAnswers ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                )}
                {!editingAnswerKey ? (
                  <button
                    onClick={() => {
                      setEditingAnswerKey(true);
                      setTempAnswerKey([...data.answerKey.answers]);
                    }}
                    className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    <Edit2 className="h-4 w-4" />
                    <span>Edit Key</span>
                  </button>
                ) : (
                  <button
                    onClick={saveAnswerKey}
                    className="flex items-center space-x-1 text-green-600 hover:text-green-700 transition-colors"
                  >
                    <Save className="h-4 w-4" />
                    <span>Save Key</span>
                  </button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-10 gap-4">
              {visibleAnswers.map((answer, index) => (
                <div
                  key={index}
                  className="flex flex-col items-center justify-center p-3 bg-gray-50 rounded-lg"
                >
                  <span className="text-sm text-gray-500">Q{index + 1}</span>
                  {editingAnswerKey ? (
                    <select
                      value={tempAnswerKey[index]}
                      onChange={(e) => handleAnswerKeyChange(index, e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    >
                      {ANSWER_OPTIONS.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-lg font-bold">{answer}</span>
                  )}
                </div>
              ))}
            </div>
          </Card>

          <Card className="bg-white rounded-xl shadow-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rank</TableHead>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Answers</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student, index) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <div className="flex items-center">
                        {getRankIcon(index + 1)}
                        <span className={`font-bold ${getRankColor(index + 1)}`}>
                          #{index + 1}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell>
                      <span className="font-bold">{student.score}%</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        {(showAllAnswers ? student.answers : student.answers.slice(0, INITIAL_ANSWERS_SHOWN)).map((answer, index) => (
                          <div
                            key={index}
                            className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-medium ${
                              answer === data.answerKey.answers[index]
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {answer}
                          </div>
                        ))}
                        {!showAllAnswers && student.answers.length > INITIAL_ANSWERS_SHOWN && (
                          <button
                            onClick={toggleAnswersView}
                            className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 text-xs font-medium hover:bg-gray-200 transition-colors"
                          >
                            +{student.answers.length - INITIAL_ANSWERS_SHOWN}
                          </button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {student.score >= 60 ? (
                        <span className="flex items-center text-green-600">
                          <CheckCircle2 className="h-5 w-5 mr-1" />
                          Passed
                        </span>
                      ) : (
                        <span className="flex items-center text-red-600">
                          <XCircle className="h-5 w-5 mr-1" />
                          Failed
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}