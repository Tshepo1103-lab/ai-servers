import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { Document } from "@langchain/core/documents";
import { OpenAIEmbeddings } from "@langchain/openai";
import dotenv from "dotenv";
import {
    GetProfileByIdAsync
} from "./../repository/getDBprofiles.js";
dotenv.config();

const apiKey = process.env.openAI_ApiKey;
// Check if the API key is defined
if (!apiKey) {
  throw new Error("OpenAI API key not found, error!");
}

const runVectorStore = async (documents, documentMetaData, directory) => {
  let vectorstore = await FaissStore.load(
    directory,
    new OpenAIEmbeddings({
      openAIApiKey: apiKey,
    })
  );

// const vectorstore = await FaissStore.fromTexts(
//     ["Hello world", "Bye bye", "hello nice world"],
//     [{ id: 2 }, { id: 1 }, { id: 3 }],
//     new OpenAIEmbeddings({
//         openAIApiKey: apiKey,
//     })
//   );
  
  if (!vectorstore) {
    vectorstore = await FaissStore.fromTexts(
      [
        new Document({
          pageContent: documents,
          metadata: documentMetaData,
        }),
      ],
      new OpenAIEmbeddings({
        openAIApiKey: apiKey,
      })
    );
  } else {
    // add document
    await vectorstore.addDocuments(
      [
        new Document({
          pageContent: documents,
          metadata: {id:documentMetaData},
        }),
      ],
      new OpenAIEmbeddings({
        openAIApiKey: apiKey,
      })
    );
  }

  await vectorstore.save(directory);
};

export const embeddata = async (request, res) => {
  const profileId = request.query.profileId;
  if (!profileId) {
    return;
  }

  const directory = "database";
  // getProfiles from the database
  try {
    let response = await GetProfileByIdAsync(profileId);
    response = response.result;
    let documents = [];
    let documentMetaData = [];
    if (response) {
      // 1 - get response data and  concatenate it
      let gender = response.gender;
      let ageRange = response.ageRange;
      let height = response.height;
      let build = response.build;
      let eyeColor = response.eyeColor;
      let skinTone = response.skinTone;
      let hairColor = response.hairColor;
      let locationFound = response.locationFound;
      let distinguishingFeature = response.distinguishingFeature;
      let moreDetails = response.moreDetails;
      let profileId = response.id;

      let prepData =
        gender +
        "\n" +
        ageRange +
        "\n" +
        height +
        "\n" +
        build +
        "\n" +
        eyeColor +
        "\n" +
        skinTone +
        "\n" +
        hairColor +
        "\n" +
        locationFound +
        "\n" +
        distinguishingFeature +
        "\n" +
        moreDetails;

    //   console.log(prepData);
      documents.push(prepData);
      documentMetaData.push({ ProfileId: profileId });
      runVectorStore(prepData, profileId , directory);
    }
    // 2 - Use embedding model and store in Vector database
   

    res.json({ message: "got here" });
  } catch (error) {
    console.error(error);
  }
};
