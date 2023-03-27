const AWS = require("aws-sdk");
const { Client } = require('pg');
const { fetchApiQuery } = require("./shared/omniQuotesApiQuery");
const { fetchScheduleQuery } = require("./shared/omniQuotesScheduleQuery")
const json2csv = require('json2csv').parse;
const fs = require('fs');
const s3 = new AWS.S3();


const Host = process.env.DB_HOST
const Port = process.env.DB_PORT
const User = process.env.DB_USERNAME
const Password = process.env.DB_PASSWORD
const Database = process.env.DB_DATABASE

module.exports.handler = async (event, context) => {
    try {
        console.info("Event: \n", JSON.stringify(event));

        if (event.httpMethod === 'GET') {
            const body = event.body;
            const fromDate = body.fromDate;
            const toDate = body.toDate;
            const ApiQuery = await fetchApiQuery(fromDate, toDate)
            const jsonData = await fetchDataFromRedshiftForApi(ApiQuery);
            await outputData(jsonData)


        } else if (event.source === 'aws.events' && event['detail-type'] === 'Scheduled Event') {
            const ScheduleQuery = await fetchScheduleQuery()
            const jsonData = await fetchDataFromRedshiftForSchedule(ScheduleQuery);
            await outputData(jsonData)
            
        }
    } catch (err) {
        console.log("handler:error", err);
        throw err;
    }
    console.log("end of the code");
};


async function outputData(jsonData) {
    const timestamp = new Date()
    const filename = "QuoteData-" + timestamp.toISOString().substring(5, 10) + '-' + timestamp.toISOString().substring(0, 4) + ".csv"
    console.log("filename", filename)
    const json2Csv = await convertToCSV(jsonData, filename)
    const uploadFile = await uploadFileToS3(filename)
    return uploadFile;
}


async function fetchDataFromRedshiftForApi(ApiQuery) {
    const client = new Client({
        host: Host,
        port: Port,
        user: User,
        password: Password,
        database: Database
    });
    try {
        const query = ApiQuery
        await client.connect();
        const res = await client.query(query);
        console.log(res.rows[1]);
        const quotesDataArray = res.rows
        await client.end();
        return quotesDataArray;
    }
    catch (error) {
        console.log("fetchDataFromRedshift:", error)
        throw error
    }
}

async function fetchDataFromRedshiftForSchedule(ScheduleQuery) {
    const client = new Client({
        host: Host,
        port: Port,
        user: User,
        password: Password,
        database: Database
    });
    try {
        const query = ScheduleQuery
        await client.connect();
        const res = await client.query(query);
        console.log(res.rows[1]);
        const quotesDataArray = res.rows
        await client.end();
        return quotesDataArray;
    }
    catch (error) {
        console.log("fetchDataFromRedshift:", error)
        throw error
    }
}

async function convertToCSV(jsonData, filename) {
    try {
        const csv = json2csv(jsonData);
        await fs.promises.writeFile("/tmp/"+filename, csv);
        console.log(`JSON data successfully converted to CSV and saved at ${filename}`);
        return csv;
    } catch (error) {
        console.error(`Error converting JSON data to CSV: ${error}`);
        throw error;
    }
}

async function uploadFileToS3(filename) {
    try {
        console.log("uploadFileToS3")
        const bucketName = process.env.S3_BUCKET_NAME

        const fileContent = fs.readFileSync("/tmp/"+filename)
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
        throw err;
    }
}
