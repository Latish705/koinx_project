import { Request, Response } from "express";

export const getStats = async (req: Request, res: Response) => {
  try {
    const { coinId: string } = req.params;
  } catch (error: any) {
    console.log(error.message);
    res.status(500).send("Server Error");
  }
};

export const deviaton = async (req: Request, res: Response) => {
  try {
    const { coinId: string } = req.params;
  } catch (error: any) {
    console.log(error.message);
    res.status(500).send("Server Error");
  }
};
