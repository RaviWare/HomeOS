 // Initial sample data now comes from the procedural 25-year demo generator.
 // See seedData.ts. Names kept stable so App.tsx imports are unchanged.
 import { generateDemoModel } from "./seedData";
 const demo = generateDemoModel();
 export const INITIAL_PROPERTIES = demo.properties;
 export const INITIAL_LEASES = demo.leases;
 export const INITIAL_TRANSACTIONS = demo.transactions;
 export const INITIAL_UTILITIES = demo.utilities;
 export const INITIAL_MAINTENANCE = demo.tickets;
 export const INITIAL_DOCUMENTS = demo.documents;
 
