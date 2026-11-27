import mongoose,{Schema,Model} from "mongoose";

export interface CronLockLook{
    _id:string;
    ownerToken:string;
    expiresAt:Date;
    createdAt:Date;
    updatedAt:Date;
}

const CronLockSchema=new Schema<CronLockLook>({
    _id:{
        type:String,
        required:true,
    },
    ownerToken:{
        type:String,
        required:true,
    },
    expiresAt:{
        type:Date,
        required:true,
    },

},{
    timestamps:true,
    versionKey:false,
});

const CronLock:Model<CronLockLook>=mongoose.models.CronLock||mongoose.model<CronLockLook>("CronLock",CronLockSchema);

export default CronLock;