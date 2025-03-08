import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Calendar, Upload, Clock, BookOpen } from 'lucide-react';
import axios from 'axios';

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

interface FormData {
  num_weeks: number;
  start_time: string;
  end_time: string;
  lecture_duration: number;
  list_of_days: string[];
}

const TimetableForm: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    num_weeks: 1,
    start_time: "",
    end_time: "",
    lecture_duration: 1,
    list_of_days: [],
  });
  const [files, setFiles] = useState<FileList | null>(null);
  const [timeTableid, settimeTableid] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error" | "";
    message: string;
  }>({ type: "", message: "" });

  const API_BASE_URL = import.meta.env.VITE_NODE_BACKEND || "http://localhost:5000";
  const GENERATE_URL = "http://localhost:8000/generate-timetable/";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "lecture_duration" || name === "num_weeks" ? Number(value) : value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(e.target.files);
    }
  };

  const handleDaySelection = (day: string) => {
    setFormData((prev) => ({
      ...prev,
      list_of_days: prev.list_of_days.includes(day)
        ? prev.list_of_days.filter((d) => d !== day)
        : [...prev.list_of_days, day],
    }));
  };

  const generateTimetable = async () => {
    if (!files || files.length === 0) {
      setNotification({
        type: "error",
        message: "Please upload at least one PDF file.",
      });
      return;
    }

    if (
      !formData.start_time ||
      !formData.end_time ||
      formData.list_of_days.length === 0 ||
      !timeTableid
    ) {
      setNotification({
        type: "error",
        message: "Please fill all required fields including Teacher ID.",
      });
      return;
    }

    setLoading(true);

    try {
      const formDataToSend = new FormData();

      for (let i = 0; i < files.length; i++) {
        formDataToSend.append("files", files[i]);
      }

      const requestData = {
        ...formData,
        model_name: "gemini-2.0-flash",
      };

      formDataToSend.append("request", JSON.stringify(requestData));

      const response = await axios.post(GENERATE_URL, formDataToSend, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (!response.data || !response.data.timetable) {
        throw new Error("Invalid response format from timetable generation API");
      }

      // Store the timetable in MongoDB
      const transformedData = {
        timeTableid: timeTableid,
        weeks: response.data.timetable.map((week: any) => ({
          weekNumber: week.week,
          days: week.days.map((day: any) => ({
            day: day.day,
            schedule: day.schedule.map((lecture: any) => ({
              time: lecture.time,
              subject: lecture.subject,
              topic: lecture.topic,
              completed: lecture.status === "Completed",
            })),
          })),
        })),
      };

      await axios.post(`${API_BASE_URL}/timetable/storetimetable`, transformedData);

      // Navigate to timetable display with the generated data
      navigate('/timetable', { 
        state: { 
          timetable: response.data.timetable,
          timeTableid: timeTableid
        }
      });

    } catch (error) {
      console.error("Error generating timetable:", error);
      setNotification({
        type: "error",
        message: "Failed to generate timetable. Check console for details.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Quick stats for the form
  const stats = [
    { title: "Selected Days", value: formData.list_of_days.length, icon: Calendar, color: "blue" },
    { title: "Duration (Hours)", value: formData.lecture_duration, icon: Clock, color: "green" },
    { title: "Weeks", value: formData.num_weeks, icon: BookOpen, color: "purple" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Timetable Generator</h1>
            <p className="text-gray-600">Create and manage your teaching schedule</p>
          </div>
        </div>

        {notification.type && (
          <Alert
            className={`mb-6 ${
              notification.type === "success" ? "bg-green-100" : "bg-red-100"
            }`}
          >
            <AlertDescription>{notification.message}</AlertDescription>
          </Alert>
        )}

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

        <div className="bg-white rounded-xl shadow-md p-8 max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Teacher ID</label>
              <Input
                type="text"
                value={timeTableid}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => settimeTableid(e.target.value)}
                placeholder="Enter unique teacher ID"
                className="mb-4"
              />

              <label className="block text-sm font-medium text-gray-700 mb-2">Number of Weeks</label>
              <Input
                type="number"
                name="num_weeks"
                value={formData.num_weeks}
                onChange={handleChange}
                min={1}
                className="mb-4"
              />

              <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
              <Input
                type="time"
                name="start_time"
                value={formData.start_time}
                onChange={handleChange}
                className="mb-4"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
              <Input
                type="time"
                name="end_time"
                value={formData.end_time}
                onChange={handleChange}
                className="mb-4"
              />

              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lecture Duration (hours)
              </label>
              <Input
                type="number"
                name="lecture_duration"
                value={formData.lecture_duration}
                onChange={handleChange}
                min={0.5}
                step={0.5}
                className="mb-4"
              />

              <label className="block text-sm font-medium text-gray-700 mb-2">Upload PDF Files</label>
              <div className="relative">
                <Input
                  type="file"
                  multiple
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="mb-4"
                />
                <Upload className="absolute right-3 top-2 h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Days</label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              {daysOfWeek.map((day) => (
                <label
                  key={day}
                  className={`flex items-center justify-center p-3 rounded-lg border cursor-pointer transition-colors ${
                    formData.list_of_days.includes(day)
                      ? 'bg-purple-100 border-purple-500 text-purple-700'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.list_of_days.includes(day)}
                    onChange={() => handleDaySelection(day)}
                    className="hidden"
                  />
                  <span>{day}</span>
                </label>
              ))}
            </div>
          </div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="mt-6"
          >
            <Button
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-medium"
              onClick={generateTimetable}
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <span className="mr-2">Generating...</span>
                </span>
              ) : (
                "Generate & Save Timetable"
              )}
            </Button>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default TimetableForm;