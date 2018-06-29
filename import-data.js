import { Client as Elasticsearch } from "elasticsearch";
const dataset = require("./dataset.json");

const INDEX_NAME = "swapi";
const client = new Elasticsearch({
  host: "localhost:9200",
  log: "trace"
});

const documents = dataset.data.allPeople.people.reduce(
  (documents, person, index) => {
    const { filmConnection, vehicleConnection, ...details } = person;

    documents.push({
      index: { _index: INDEX_NAME, _type: "person", _id: index }
    });

    documents.push({
      ...details,
      films: filmConnection.films,
      vehicles: vehicleConnection.vehicles
    });

    return documents;
  },
  []
);

const run = async () => {
  await client.indices.delete({ index: INDEX_NAME });
  await client.indices.create({ index: INDEX_NAME });

  await client.bulk({
    body: documents
  });
};

run();
