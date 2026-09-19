import express, { Request, Response } from 'express';
import { setupSwagger } from './config/swagger';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import facilityRoutes from './routes/facility.routes';
import bookingRoutes from './routes/booking.routes';
import { initBookingCron } from './cron/booking.cron';
import cors from 'cors';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

// Register API routes
app.use('/api/auth', authRoutes);
app.use('/api/facilities', facilityRoutes);
app.use('/api/bookings', bookingRoutes);
setupSwagger(app);

console.log('Routes registered!');

app.get('/', (req: Request, res: Response) => {
  res.status(200).json({ 
    status: 'success', 
    message: 'Facility Booking & User Management API is running live!' 
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  
  // Initialize the background notification cron worker
  initBookingCron();
});