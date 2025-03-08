import { Request, Response } from "express";
import { OMRResult } from "../models";

// Define the mapping between question numbers and answers
const answerMap: { [key: string]: string } = {
  A: "A",
  B: "B",
  C: "C",
  D: "D",
};

const mapOMRResults = (
  omrResults: string
): Array<{ question: string; answer: string }> => {
  const resultObj: { [key: string]: string } = JSON.parse(omrResults); // Convert string into object
  const mappedResults: Array<{ question: string; answer: string }> = [];

  for (const [key, value] of Object.entries(resultObj)) {
    mappedResults.push({
      question: key,
      answer: answerMap[value] || value, // Map answer using the answerMap
    });
  }

  return mappedResults;
};

const createOMRResult = async (req: Request, res: Response) => {
  const {
    omr_results,
    success,
    username,
    userid,
    assignment_id,
    assignment_topic,
    timestamp,
  } = req.body;

  const mappedResults = mapOMRResults(omr_results);

  const newOMRResult = new OMRResult({
    omr_results: mappedResults,
    success,
    username,
    userid,
    assignment_id,
    assignment_topic,
    timestamp,
  });

  await newOMRResult.save();

  return res.status(201).json({
    message: "OMR result saved successfully",
    data: newOMRResult,
  });
};

const getAllOMRResults = async (req: Request, res: Response) => {
  const omrResults = await OMRResult.find();
  return res.status(200).json({
    message: "OMR results retrieved successfully",
    data: omrResults,
  });
};

const getOMRResultById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const omrResult = await OMRResult.findById(id);
  if (!omrResult) {
    return res.status(404).json({
      message: "OMR result not found",
    });
  }
  return res.status(200).json({
    message: "OMR result retrieved successfully",
    data: omrResult,
  });
};

export { createOMRResult, getAllOMRResults, getOMRResultById };
