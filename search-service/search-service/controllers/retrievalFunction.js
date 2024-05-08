// langchain llm
import { OpenAIEmbeddings } from '@langchain/openai';
import { createRetrievalChain } from "langchain/chains/retrieval";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import dotenv from 'dotenv';
import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { GetProfileByIdAsync } from "../repository/getDBprofiles.js";
dotenv.config();

const apiKey = process.env.openAI_ApiKey;
// Check if the API key is defined
if (!apiKey) {
  throw new Error("OpenAI API key not found, error!");
}

// use gpt llm
const chatModel = new ChatOpenAI({
  openAIApiKey: apiKey,
});

const prompt =
  ChatPromptTemplate.fromTemplate(` You are an expert in finding patients at the hospital based on traits.
  Answer the following question as best as you can based only on the provided context. Do not answer based on the general knowledge you have.
    <context>
    {context}
    </context>
    
    Question: {input}`);

export const retrievalFunction = async (req, res) => {
  // get user input
  const userInput = req.query.prompt;
  if (!userInput) {
    return;
  }

  const directory = "database";
  try {
    // load data from the vector database
    let loadedVectorStore = await FaissStore.load(directory, new OpenAIEmbeddings({
        openAIApiKey: apiKey,
    }));

    // let response = await getBooks() not getting books from the database anymore
    // return book Data as Json object
    // response = response.result.items;
    if (loadedVectorStore) {
      
      // 3 - Using llm for chaining
      // prompt gpt to search/recommend book
      // use chatmodel(openAi) declared above
      // use prompt declared above

      const combineDocsChain = await createStuffDocumentsChain({
        llm: chatModel,
        prompt,
      });
   
      // 4 - Retrieve data from VectorDatabase
      // This will allow that search, recommendation comes from the
      //vectorstore we just created
      const retriever =  loadedVectorStore.asRetriever();
      const retrievalChain = await createRetrievalChain({
        combineDocsChain:combineDocsChain,
        retriever,
      });

      
      // make the system conversational
      const result = await retrievalChain.invoke({ input: userInput });

        const profiles = await getMatchingProfiles(result.context);
    //   res.json({response:result});
       res.json({ answer: result.answer, profiles: { profiles } });
    } else {
      res.json({ message: "No data found" });
    }
  } catch (error) {
    console.log("Sorry, error getting profiles", error);
  }
};

// This function will return suggested profile(s) from the NLP
const getMatchingProfiles = async (context) => {
  const matchingProfiles_Id = [];
  for (let profile of context) {
    matchingProfiles_Id.push(profile.metadata.id);
    
  }

  try {
    if (matchingProfiles_Id) {
      let ans = [];
      for (let id of matchingProfiles_Id) {
        ans.push(await GetProfileByIdAsync(id));
      }

      // New array of objects simplified
      const simplifiedProfiles = ans.map((profile) => (
        {
          id: profile.result?.id,
          gender:profile.result?.gender,
          ageRange: profile.result?.ageRange,
          admissionDate: profile.result?.admissionDate,
          distinguishingFeature:profile.result?.distinguishingFeature
        }
      ));

      return simplifiedProfiles;
    }
  } catch (error) {
    console.log("Error getting profiles", error);
  }
}; 
