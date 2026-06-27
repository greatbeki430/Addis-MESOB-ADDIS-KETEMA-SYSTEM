// backend/src/controllers/serviceController.js
const Service = require("../models/Service");
// const SERVICES = require("../../constants/services");
const SERVICES = require("../constants/services");
const cloudinary = require("../config/cloudinary");

const getServices = async (req, res) => {
  try {
    const services = await Service.find();
    res.json(services);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const seedServices = async (req, res) => {
  try {
    if (
      !req.user ||
      (req.user.role !== "admin" && req.user.role !== "superadmin")
    ) {
      return res
        .status(403)
        .json({ message: "Unauthorized: Admin access required" });
    }

    await Service.deleteMany({});
    console.log("🗑️ Cleared existing services");

    const result = await Service.insertMany(SERVICES);
    res.status(201).json({
      message: `✅ ${result.length} services seeded successfully!`,
      count: result.length,
      services: result,
    });
  } catch (error) {
    console.error("Seed services error:", error);
    res.status(500).json({ message: error.message });
  }
};

const uploadImage = async (base64Image) => {
  try {
    const result = await cloudinary.uploader.upload(base64Image, {
      folder: "services",
      transformation: [
        { width: 200, height: 200, crop: "fill" },
        { quality: "auto:good" },
        { fetch_format: "auto" },
      ],
    });
    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw new Error("Failed to upload image");
  }
};

const deleteImage = async (publicId) => {
  try {
    if (publicId) {
      await cloudinary.uploader.destroy(publicId);
      console.log(`🗑️ Deleted image: ${publicId}`);
    }
  } catch (error) {
    console.error("Cloudinary delete error:", error);
  }
};

const addService = async (req, res) => {
  try {
    if (
      !req.user ||
      (req.user.role !== "admin" && req.user.role !== "superadmin")
    ) {
      return res
        .status(403)
        .json({ message: "Unauthorized: Admin access required" });
    }

    const { dept, deptEn, name, nameEn, active, stdTime, image } = req.body;

    if (!dept || !name) {
      return res
        .status(400)
        .json({ message: "Department and Name are required" });
    }

    const existing = await Service.findOne({ name, dept });
    if (existing) {
      return res
        .status(400)
        .json({ message: "Service already exists in this department" });
    }

    let imageUrl = "";
    let imagePublicId = "";

    if (image && image.startsWith("data:image")) {
      try {
        const uploadResult = await uploadImage(image);
        imageUrl = uploadResult.url;
        imagePublicId = uploadResult.publicId;
      } catch (error) {
        return res.status(400).json({ message: "Failed to upload image" });
      }
    }

    const service = new Service({
      dept,
      deptEn: deptEn || dept,
      name,
      nameEn: nameEn || name,
      active: active !== undefined ? active : true,
      stdTime: stdTime || "",
      image: imageUrl,
      imagePublicId: imagePublicId,
    });

    await service.save();
    res.status(201).json({
      message: "✅ Service added successfully!",
      service,
    });
  } catch (error) {
    console.error("Add service error:", error);
    res.status(500).json({ message: error.message });
  }
};

const updateService = async (req, res) => {
  try {
    if (
      !req.user ||
      (req.user.role !== "admin" && req.user.role !== "superadmin")
    ) {
      return res
        .status(403)
        .json({ message: "Unauthorized: Admin access required" });
    }

    const { id } = req.params;
    const updates = req.body;

    const existingService = await Service.findById(id);
    if (!existingService) {
      return res.status(404).json({ message: "Service not found" });
    }

    if (updates.image) {
      if (updates.image.startsWith("data:image")) {
        if (existingService.imagePublicId) {
          await deleteImage(existingService.imagePublicId);
        }
        try {
          const uploadResult = await uploadImage(updates.image);
          updates.image = uploadResult.url;
          updates.imagePublicId = uploadResult.publicId;
        } catch (error) {
          return res.status(400).json({ message: "Failed to upload image" });
        }
      } else if (updates.image === "") {
        if (existingService.imagePublicId) {
          await deleteImage(existingService.imagePublicId);
        }
        updates.imagePublicId = "";
      }
    }

    const service = await Service.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    res.json({
      message: "✅ Service updated successfully!",
      service,
    });
  } catch (error) {
    console.error("Update service error:", error);
    res.status(500).json({ message: error.message });
  }
};

const deleteService = async (req, res) => {
  try {
    if (
      !req.user ||
      (req.user.role !== "admin" && req.user.role !== "superadmin")
    ) {
      return res
        .status(403)
        .json({ message: "Unauthorized: Admin access required" });
    }

    const { id } = req.params;

    const service = await Service.findById(id);
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    if (service.imagePublicId) {
      await deleteImage(service.imagePublicId);
    }

    await Service.findByIdAndDelete(id);

    res.json({
      message: "✅ Service deleted successfully!",
    });
  } catch (error) {
    console.error("Delete service error:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getServices,
  seedServices,
  addService,
  updateService,
  deleteService,
};
