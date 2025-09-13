const mongoose = require('mongoose');


const fileSchema = new mongoose.Schema(
  {
    path:{
        type:String,
        required:[true,'File path is required']
    },
    originalName:{
        type:String,
        required:[true,'Original name is required']
    },
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User', // Conventionally, ref should be the Model name
        required:[true,'User is required']
    },
    size: {
        type: Number,
        required: [true, 'File size is required']
    },
    mimetype: {
        type: String,
        required: [true, 'MIME type is required']
    }
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt fields
);

const File = mongoose.model('File', fileSchema);

module.exports = File;