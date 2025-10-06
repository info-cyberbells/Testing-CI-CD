import Event from '../model/eventModel.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import moment from 'moment-timezone';

// Ensure the uploads directory exists
const uploadDir = 'uploads/events';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Set up multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir); // Save images inside 'uploads/events'
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname)); // Unique filename
  },
});

// File filter to accept only images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};


export const addEvent = async (req, res) => {
  try {
    const { name, date, description, event_church_location, churchId, images } = req.body;
    if (!date) {
      throw new Error('Date is required');
    }
    // Append seconds and UTC marker to ensure exact storage
    const eventDate = new Date(`${date}:00Z`);
    if (isNaN(eventDate.getTime())) {
      throw new Error('Invalid date format');
    }
    let imageUrls = [];
    const host = `${req.protocol}://${req.get('host')}`;
    if (images && Array.isArray(images)) {
      images.forEach((base64Image, index) => {
        const matches = base64Image.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
        if (!matches) {
          throw new Error('Invalid image format');
        }
        const ext = matches[1];
        const base64Data = matches[2];
        const fileName = `${Date.now()}-${index}.${ext}`;
        const filePath = path.join('uploads/events', fileName);
        fs.writeFileSync(filePath, base64Data, { encoding: 'base64' });
        imageUrls.push(`${host}/uploads/events/${fileName}`);
      });
    }
    const newEvent = new Event({
      name,
      date: eventDate,
      description,
      event_church_location,
      churchId,
      images: imageUrls
    });
    await newEvent.save();
    res.status(201).json({ message: 'Event saved successfully', event: newEvent });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};


export const fetchAllEvent = async (req, res) => {
  try {
    const { churchId } = req.query;

    const query = churchId ? { churchId } : {};

    const events = await Event.find(query);

    console.log(events);
    res.status(200).json(events);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// export const fetchAllEvent = async (req, res) => {
//   try {
//     const { churchId } = req.params; // Assume churchId is sent as a URL parameter
//     const events = await Event.find({ churchId });

//     // If no events are found, `events` will be an empty array, and it will return with a 200 status.
//     console.log(events);
//     res.status(200).json(events);
//   } catch (error) {
//     res.status(400).json({ error: error.message });
//   }
// };


// Add this function to your Event controller
// export const countAllEvents = async (req, res) => {
//   try {
//     const count = await Event.countDocuments(); // Count all Eventes
//     res.status(200).json({ total: count }); // Return the total count in the response
//   } catch (error) {
//     res.status(500).json({ error: error.message }); // Handle errors
//   }
// };


export const countAllEvents = async (req, res) => {
  try {
    const { churchId } = req.query; // Get churchId from query parameters

    const count = churchId
      ? await Event.countDocuments({ churchId }) // Count events for specific churchId
      : await Event.countDocuments(); // Count all events if no churchId is specified

    res.status(200).json({ total: count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const fetchEventType = async (req, res) => {
  try {
    const { type, churchId } = req.params; // Assuming type and churchId are URL parameters
    const events = await Event.find({ type, churchId });
    res.status(200).json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const detailEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const eventDetail = await Event.findOne({ _id: id });
    if (!eventDetail) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.status(200).json(eventDetail);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};


export const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const updateFields = { ...req.body };
    const host = `${req.protocol}://${req.get('host')}`;

    // Find existing event
    const existingEvent = await Event.findById(id);
    if (!existingEvent) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Handle date as UTC
    if (updateFields.date) {
      const eventDate = new Date(`${updateFields.date}:00Z`);
      if (isNaN(eventDate.getTime())) {
        throw new Error('Invalid date format');
      }
      updateFields.date = eventDate;
    }

    // Handle images
    let imageUrls = [];
    if (updateFields.images && Array.isArray(updateFields.images)) {
      updateFields.images.forEach((image, index) => {
        if (image.startsWith('data:image')) {
          const matches = image.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
          if (!matches) {
            throw new Error('Invalid image format');
          }
          const ext = matches[1];
          const base64Data = matches[2];
          const fileName = `${Date.now()}-${index}.${ext}`;
          const filePath = path.join('uploads/events', fileName);
          fs.writeFileSync(filePath, base64Data, { encoding: 'base64' });
          imageUrls.push(`${host}/uploads/events/${fileName}`);
        } else {
          imageUrls.push(image);
        }
      });
      updateFields.images = imageUrls;
    }

    // Update the event
    const updatedEvent = await Event.findOneAndUpdate(
      { _id: id },
      { $set: updateFields },
      { new: true }
    );

    res.status(200).json({ message: 'Event updated successfully', event: updatedEvent });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete Event by ID
export const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedEvent = await Event.findOneAndDelete({ _id: id });

    if (!deletedEvent) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.status(200).json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};


// Corrected condition in deleteEventImages function
export const deleteEventImages = async (req, res) => {
  try {
    const { id } = req.params;
    const { imageIndices } = req.body;

    console.log('Event ID:', id);
    console.log('Image indices to delete:', imageIndices);

    if (!Array.isArray(imageIndices) || imageIndices.length === 0) {
      return res.status(400).json({ error: 'No image indices provided' });
    }

    // Get the event
    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    console.log('Current images in DB:', event.images);

    // Validate indices
    const validIndices = imageIndices.filter(index =>
      Number.isInteger(Number(index)) && Number(index) >= 0 && Number(index) < event.images.length
    );

    if (validIndices.length === 0) {
      return res.status(400).json({ error: 'No valid image indices provided' });
    }

    console.log('Valid indices:', validIndices);

    // Get the URLs of images to delete
    const imagesToDelete = validIndices.map(index => event.images[Number(index)]);
    console.log('Images to delete:', imagesToDelete);

    // Create a new array of images excluding the ones with specified indices
    const updatedImages = event.images.filter((_, index) => !validIndices.includes(index.toString()) && !validIndices.includes(index));
    console.log('Updated images:', updatedImages);

    // Extract filenames from URLs to delete from filesystem
    const filesToDelete = imagesToDelete.map(url => {
      const urlParts = url.split('/');
      return urlParts[urlParts.length - 1];
    });

    // Update the event with the new image list using MongoDB update operation
    const updateResult = await Event.updateOne(
      { _id: id },
      { $set: { images: updatedImages } }
    );

    console.log('Update result:', updateResult);

    // Try to delete the actual files
    filesToDelete.forEach(filename => {
      const filePath = path.join('uploads/events', filename);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
          console.log(`Deleted file: ${filePath}`);
        } catch (err) {
          console.error(`Failed to delete file ${filePath}:`, err);
        }
      } else {
        console.log(`File not found: ${filePath}`);
      }
    });

    // Fetch the updated event to return the latest image array
    const updatedEvent = await Event.findById(id);

    res.status(200).json({
      message: 'Images deleted successfully',
      deletedCount: validIndices.length,
      remainingImages: updatedEvent.images,
      deletedImages: imagesToDelete
    });
  } catch (error) {
    console.error('Error in deleteEventImages:', error);
    res.status(400).json({ error: error.message });
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit per file
});

