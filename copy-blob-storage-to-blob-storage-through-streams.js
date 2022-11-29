const {
  BlobServiceClient,
  ContainerClient,
  BlockBlobClient,
} = require("@azure/storage-blob");
const { DefaultAzureCredential } = require("@azure/identity");
const { v1: uuidv1 } = require("uuid");

const streamToText = async (readable) => {
  readable.setEncoding("utf8");
  let data = "";
  for await (const chunk of readable) {
    data += chunk;
  }
  return data;
};

// const copyBlob = async (blobServiceClient, sourceBlobSContainerName, sourceBlobName, destinationBlobContainerName, destinationBlobName) => {
//     // create container clients
//     const sourceContainerClient = blobServiceClient.getContainerClient(sourceBlobSContainerName);
//     const destinationContainerClient = blobServiceClient.getContainerClient(destinationBlobContainerName);

//     // create blob clients
//     const sourceBlobClient = await sourceContainerClient.getBlobClient(sourceBlobName);
//     const destinationBlobClient = await destinationContainerClient.getBlobClient(destinationBlobName);

//     // start copy
//     const copyPoller = await destinationBlobClient.beginCopyFromURL(sourceBlobClient.url);
//     console.log('start copy from A to B');

//     // wait until done
//     await copyPoller.pollUntilDone();
// }

// const copyBlob = async (srcBlobServiceClient, destBlobServiceClient, soureBlobContainerName, sourceBlobName, destinationBlobContainerName, destinationBlobName) => {
//     // create container clients
//     const sourceContainerClient = srcBlobServiceClient.getContainerClient(soureBlobContainerName);
//     const destinationContainerClient = destBlobServiceClient.getContainerClient(destinationBlobContainerName);

//     // create blob clients
//     const sourceBlobClient = await sourceContainerClient.getBlobClient(sourceBlobName);
//     const destinationBlobClient = await destinationContainerClient.getBlobClient(destinationBlobName);

//     console.log('test123')

//     // start copy
//     let copyPoller;
//     try {
//         copyPoller = await destinationBlobClient.beginCopyFromURL(sourceBlobClient.url);
//     } catch(err) {
//         console.log(err)
//     }

//     console.log('start copy from A to B');

//     // wait until done
//     await copyPoller.pollUntilDone();
// }

// const transformStream = new Transform({
//   transform(chunk, encoding, callback) {
//     console.log(chunk);
//     callback(null, chunk);
//   },
//   decodeStrings: false,
// });
const createBlobFromReadStream = async (
  containerClient,
  blobName,
  readableStream,
  uploadOptions
) => {
  const blockBlobClient = await containerClient.getBlockBlobClient(blobName);

  await blockBlobClient.uploadStream(readableStream);
};

const downloadBlobAsStream = async (
  containerClient,
  blobName,
  writableStream
) => {
  const blobClient = await containerClient.getBlobClient(blobName);
  const downloadResponse = await blobClient.download();

  //   console.log(downloadResponse.readableStreamBody);

  return downloadResponse.readableStreamBody;
  //   downloadResponse.readableStreamBody.pipe(writableStream)
  //   console.log(`download of ${blobName} succeded`);
};

module.exports = async function (context, req) {
  // context.log('JavaScript HTTP trigger function processed a request.');

  // const name = (req.query.name || (req.body && req.body.name));
  // const responseMessage = name
  //     ? "TEST 123"
  //     : "This HTTP triggered function executed successfully. Pass a name in the query string or in the request body for a personalized response.";

  const srcStorageAccountName = "fteststorageryan";
  const destStorageAccountName = "deststorageaccountryan";

  try {
    context.log("Azure Blob storage v12 - JavaScript quickstart sample");

    if (!srcStorageAccountName || !destStorageAccountName)
      throw Error("Azure Storage accountName not found");

    const srcBlobServiceClient = new BlobServiceClient(
      `https://${srcStorageAccountName}.blob.core.windows.net`,
      new DefaultAzureCredential()
    );
    const destBlobServiceClient = new BlobServiceClient(
      `https://${destStorageAccountName}.blob.core.windows.net`,
      new DefaultAzureCredential()
    );

    const srcContainerName = "source";
    const srcContainerClient =
      srcBlobServiceClient.getContainerClient(srcContainerName);

    for await (const blob of srcContainerClient.listBlobsFlat()) {
      console.log(blob.name);
    }

    destContainerName = "destination";
    const destContainerClient =
      destBlobServiceClient.getContainerClient(destContainerName);

    console.log("<< source >>");
    for await (const blob of destContainerClient.listBlobsFlat()) {
      console.log(blob.name);
    }

    console.log("<< destination >>");
    for await (const blob of destContainerClient.listBlobsFlat()) {
      console.log(blob.name);
    }

    //get readStream (COPY)
    const readableStream = await downloadBlobAsStream(
      srcContainerClient,
      "users/test@test.com/q.pdf",
      null
    );

    //write to readStream (PASTE)
    try {
      await createBlobFromReadStream(
        destContainerClient,
        "test/dir/q-copy.pdf",
        readableStream
      );

      console.log("uploaded");
    } catch (err) {
      console.log(err);
    }

    // await copyBlob(srcBlobServiceClient, destBlobServiceClient, srcContainerName, "users/test@test.com/q.pdf", "destination", "test/dir/q-copy.pdf")

    context.res = {
      status: 200 /* Defaults to 200 */,
      body: "test",
    };

    // //// creating a container
    // const containerName = `quickstart` + uuidv1()

    // context.log('\nCreating container...')
    // context.log('\t', containerName)

    // // get a reference to a container
    // const containerClient = blobServiceClient.getContainerClient(containerName);

    // // create the container
    // const createContainerResponse = await containerClient.create()
    // context.log(`Container was created successfully.\n\trequestId:${createContainerResponse.requestId}\n\tURL: ${containerClient.url}`)

    // context.res = {
    //     // status: 200, /* Defaults to 200 */
    //     body: "Done"
    // };

    // //// uploading blobls to a container

    // const blobName = 'quickstart' + uuidv1() + '.txt';

    // // get a block blob client
    // const containerClient = blobServiceClient.getContainerClient('quickstart45538f20-6bda-11ed-a7d4-d1536cb71818')
    // const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    // // Display blob name and url
    // context.log(`\nUploading to Azure storage as blob\n\tname: ${blobName}:\n\tURL: ${blockBlobClient.url}`)

    // // Upload data to the blob
    // const data = "Hello, World!";
    // const uploadBlobResponse = await blockBlobClient.upload(data, data.length);
    // context.log(`Blob was uploaded successfully. requestId: ${uploadBlobResponse.requestId}`);

    // // List the blob(s) in the container.
    // const containerClient = blobServiceClient.getContainerClient('quickstart45538f20-6bda-11ed-a7d4-d1536cb71818')

    // for await (const blob of containerClient.listBlobsFlat()) {
    //     // get Blob Client from name, to get the URL
    //     const tempBlockBlobClient = containerClient.getBlobBatchClient(blob.name);

    //     // context.log(tempBlockBlobClient.serviceOrContainerContext.client.url)
    //     // Display blob name and URL
    //     context.log(`\n\tname: ${blob.name}\n\tURL: ${tempBlockBlobClient.serviceOrContainerContext.client.url}\n`)

    // }

    //// Download blobs
    // Get blob content from position 0 to the end
    // In Node.js, get downloaded data by accessing downloadBlockBLobResponse.readableStreamBody
    // In browser, get downloaded data by accessing downloadBlockBlobResponse.blobBody

    // const containerClient = blobServiceClient.getContainerClient('quickstart45538f20-6bda-11ed-a7d4-d1536cb71818')
    // const blockBlobClient = containerClient.getBlockBlobClient('quickstart2fd2e180-6bdc-11ed-b28e-f16b9f75ed62.txt');
    // const dowdnloadBlockBlobResponse = await blockBlobClient.download(0)

    // context.log('\nDownloaded blob content...')
    // context.log('\t', await streamToText(dowdnloadBlockBlobResponse.readableStreamBody))

    // convert stream to text

    // List blobs

    // const srcContainerClient = blobServiceClient.getContainerClient('quickstart45538f20-6bda-11ed-a7d4-d1536cb71818')

    // console.log('\nListing blobs...')
    // for await (const blog of srcContainerClient.listBlobFlat()) {
    //     // const tempBlockBlobClient = srcContainerClient.getBlobBatchClient()
    // }

    // download file
    // const containerClient = blobServiceClient.getContainerClient('quickstart45538f20-6bda-11ed-a7d4-d1536cb71818')
    // const blockBlobClient = containerClient.getBlockBlobClient('quickstart2fd2e180-6bdc-11ed-b28e-f16b9f75ed62.txt');
    // const dowdnloadBlockBlobResponse = await blockBlobClient.download(0)
    // context.log('\nDownloaded blob content...')
  } catch (err) {
    context.log.error(`Error: ${err.message}`);
  }
};
