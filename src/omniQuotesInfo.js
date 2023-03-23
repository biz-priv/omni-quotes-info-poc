const AWS = require("aws-sdk");
const { Client } = require('pg');
const { omniQuotesInfoQuery } = require("./shared/omniQuotesInfoQuery");
const json2csv = require('json2csv').parse;
const fs = require('fs');
const s3 = new AWS.S3();

module.exports.handler = async () => {
    try {
        const jsonData=await fetchDataFromRedshift(omniQuotesInfoQuery);
        const timestamp = new Date()
        const filename = "QuoteData-" + timestamp.toISOString().substring(5, 10) + '-' + timestamp.toISOString().substring(0, 4) + ".csv"
        console.log("filename",filename)
        const json2Csv= await convertToCSV(jsonData,filename)
        console.log("json2Csv",json2Csv)
        const uploadFile= await uploadFileToS3(filename)
        console.log("uploadFile",uploadFile)
    } catch (err) {
        console.log("handler:error", err);
    }
    console.log("end of the code");
};

async function fetchDataFromRedshift(omniQuotesInfoQuery) {
    const client = new Client({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE
    });
    try {
        const query = omniQuotesInfoQuery
        await client.connect();
        const res = await client.query(query);
        console.log(res.rows[1]);
        const quotesDataArray = res.rows
        await client.end();
        return quotesDataArray;
    }
    catch (error) {
        console.log("fetchDataFromRedshift:", error)
    }
}

async function convertToCSV(jsonData, filename) {
    try {
        const csv = json2csv(jsonData);
        await fs.promises.writeFile(filename, csv);
        console.log(`JSON data successfully converted to CSV and saved at ${filename}`);
        return csv;
    } catch (error) {
        console.error(`Error converting JSON data to CSV: ${error}`);
    }
}

async function uploadFileToS3(filename) {
    try {
        console.log("uploadFileToS3")
        const bucketName = process.env.S3_BUCKET_NAME

        const fileContent = fs.readFileSync(filename)
        console.log("fileContent==> ", fileContent)
        const params = {
            Bucket: bucketName,
            Key: filename,
            Body: fileContent
        };
        const data = await s3.upload(params).promise();
        console.log("File uploaded successfully. File URL: ", data.Location);
        return data;
      } catch (err) {
        console.log("Error:uploadFileToS3 ", err);
      }
}
