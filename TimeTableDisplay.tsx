import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../ui/button';
import { Calendar, ArrowLeft, Save, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import axios from 'axios';

interface Lecture {
  time: string;
  subject: string;
  topic: string;
  status?: string;
  completed: boolean;
}

interface Day {
  day: string;
  schedule: Lecture[];
}

interface Week {
  week: number;
  weekNumber: number;
  days: Day[];
}

const TimetableDisplay: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [timetable, setTimetable] = useState<Week[] | null>(null);
  const [originalTimetable, setOriginalTimetable] = useState<Week[] | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [pendingLectures, setPendingLectures] = useState<Week[] | null>(null);

  const API_BASE_URL = import.meta.env.VITE_NODE_BACKEND || "http://localhost:5000";
  const teacherId = location.state?.teacherId;

  useEffect(() => {
    if (location.state?.timetable) {
      const formattedTimetable = location.state.timetable.map((week: any) => ({
        week: week.week,
        weekNumber: week.week,
        days: week.days.map((day: any) => ({
          day: day.day,
          schedule: day.schedule.map((lecture: any) => ({
            time: lecture.time,
            subject: lecture.subject,
            topic: lecture.topic,
            status: lecture.status || "Pending",
            completed: lecture.status === "Completed",
          })),
        })),
      }));

      setTimetable(formattedTimetable);
      setOriginalTimetable(JSON.parse(JSON.stringify(formattedTimetable)));
      fetchPendingLectures(formattedTimetable);
    }
  }, [location.state]);

  const fetchPendingLectures = (currentTimetable: Week[]) => {
    const pendingOnly = currentTimetable
      .map((week) => ({
        ...week,
        days: week.days
          .map((day) => ({
            ...day,
            schedule: day.schedule.filter((lecture) => !lecture.completed),
          }))
          .filter((day) => day.schedule.length > 0),
      }))
      .filter((week) => week.days.length > 0);

    setPendingLectures(pendingOnly.length > 0 ? pendingOnly : null);
  };

  const updateLectureStatus = (
    weekIndex: number,
    dayIndex: number,
    lectureIndex: number,
    newStatus: string
  ) => {
    if (!timetable) return;

    const updatedTimetable = JSON.parse(JSON.stringify(timetable));
    if (updatedTimetable[weekIndex]?.days[dayIndex]?.schedule[lectureIndex]) {
      updatedTimetable[weekIndex].days[dayIndex].schedule[lectureIndex].status = newStatus;
      updatedTimetable[weekIndex].days[dayIndex].schedule[lectureIndex].completed =
        newStatus === "Completed";

      setTimetable(updatedTimetable);
      setHasChanges(JSON.stringify(updatedTimetable) !== JSON.stringify(originalTimetable));
      fetchPendingLectures(updatedTimetable);
    }
  };

  const saveAllChanges = async () => {
    if (!timetable || !teacherId || !hasChanges) return;

    setUpdating(true);
    try {
      const updatedData = {
        teacherId: teacherId,
        weeks: timetable.map((week) => ({
          weekNumber: week.weekNumber,
          days: week.days.map((day) => ({
            day: day.day,
            schedule: day.schedule.map((lecture) => ({
              time: lecture.time,
              subject: lecture.subject,
              topic: lecture.topic,
              completed: lecture.status === "Completed",
            })),
          })),
        })),
      };

      await axios.put(`${API_BASE_URL}/timetable/updateTimetable/${teacherId}`, updatedData);
      setOriginalTimetable(JSON.parse(JSON.stringify(timetable)));
      setHasChanges(false);
    } catch (error) {
      console.error("Error updating timetable:", error);
    } finally {
      setUpdating(false);
    }
  };

  const goBack = () => {
    navigate('/admin');
  };

  if (!timetable) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-xl text-gray-600">No timetable data available.</p>
          <Button
            className="mt-4 bg-purple-600 hover:bg-purple-700 text-white"
            onClick={goBack}
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  // Calculate quick stats
  const totalLectures = timetable.reduce((acc, week) => 
    acc + week.days.reduce((dayAcc, day) => 
      dayAcc + day.schedule.length, 0), 0);
  
  const completedLectures = timetable.reduce((acc, week) => 
    acc + week.days.reduce((dayAcc, day) => 
      dayAcc + day.schedule.filter(lecture => lecture.completed).length, 0), 0);

  const stats = [
    {
      title: "Total Lectures",
      value: totalLectures,
      icon: Calendar,
      color: "blue"
    },
    {
      title: "Completed",
      value: completedLectures,
      icon: CheckCircle,
      color: "green"
    },
    {
      title: "Pending",
      value: totalLectures - completedLectures,
      icon: Clock,
      color: "yellow"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Generated Timetable</h1>
            <p className="text-gray-600">View and manage your teaching schedule</p>
          </div>
          <div className="flex gap-4">
            <Button
              className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white"
              onClick={goBack}
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </Button>
            {hasChanges && (
              <Button
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white"
                onClick={saveAllChanges}
                disabled={updating}
              >
                <Save className="h-4 w-4" />
                <span>{updating ? "Saving..." : "Save Changes"}</span>
              </Button>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-md p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 bg-${stat.color}-100 rounded-full`}>
                  <stat.icon className={`h-6 w-6 text-${stat.color}-600`} />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-1">{stat.value}</h3>
              <p className="text-gray-600 text-sm">{stat.title}</p>
            </motion.div>
          ))}
        </div>

        {/* Timetable Weeks */}
        <div className="space-y-8">
          {timetable.map((week, weekIndex) => (
            <motion.div
              key={weekIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: weekIndex * 0.1 }}
              className="bg-white rounded-xl shadow-md overflow-hidden"
            >
              <div className="bg-purple-600 p-4">
                <h2 className="text-xl font-semibold text-white">Week {week.week}</h2>
              </div>
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-semibold text-gray-600">Day</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-600">Time</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-600">Subject</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-600">Topic</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-600">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {week.days.map((day, dayIndex) =>
                        day.schedule.map((lecture, lectureIndex) => (
                          <tr
                            key={`${dayIndex}-${lectureIndex}`}
                            className={`border-b hover:bg-gray-50 transition-colors ${
                              lecture.status === "Completed"
                                ? "bg-green-50"
                                : lecture.status === "Conducted"
                                ? "bg-yellow-50"
                                : ""
                            }`}
                          >
                            <td className="py-3 px-4">{day.day}</td>
                            <td className="py-3 px-4">{lecture.time}</td>
                            <td className="py-3 px-4">{lecture.subject}</td>
                            <td className="py-3 px-4">{lecture.topic}</td>
                            <td className="py-3 px-4">
                              <select
                                value={lecture.status || "Pending"}
                                onChange={(e) =>
                                  updateLectureStatus(
                                    weekIndex,
                                    dayIndex,
                                    lectureIndex,
                                    e.target.value
                                  )
                                }
                                className={`w-full p-2 rounded-lg border ${
                                  lecture.status === "Completed"
                                    ? "bg-green-100 text-green-800"
                                    : lecture.status === "Conducted"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-white text-gray-800"
                                }`}
                              >
                                <option value="Pending">Pending</option>
                                <option value="Conducted">Conducted</option>
                                <option value="Completed">Completed</option>
                              </select>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Pending Lectures Section */}
        {pendingLectures && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-8 bg-white rounded-xl shadow-md overflow-hidden"
          >
            <div className="bg-red-600 p-4">
              <h2 className="text-xl font-semibold text-white">Pending Lectures</h2>
            </div>
            <div className="p-6">
              {pendingLectures.map((week, weekIndex) => (
                <div key={weekIndex} className="mb-6 last:mb-0">
                  <h3 className="text-lg font-semibold mb-4">Week {week.week}</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-semibold text-gray-600">Day</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-600">Time</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-600">Subject</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-600">Topic</th>
                        </tr>
                      </thead>
                      <tbody>
                        {week.days.map((day) =>
                          day.schedule.map((lecture, index) => (
                            <tr key={index} className="border-b hover:bg-gray-50">
                              <td className="py-3 px-4">{day.day}</td>
                              <td className="py-3 px-4">{lecture.time}</td>
                              <td className="py-3 px-4">{lecture.subject}</td>
                              <td className="py-3 px-4">{lecture.topic}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default TimetableDisplay;