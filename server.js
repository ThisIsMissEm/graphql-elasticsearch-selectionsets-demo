const { ApolloServer, gql } = require("apollo-server");
import { Client as Elasticsearch } from "elasticsearch";

// Type definitions define the "shape" of your data and specify
// which ways the data can be fetched from the GraphQL server.
const typeDefs = gql`
  # Comments in GraphQL are defined with the hash (#) symbol.
  type Planet {
    id: ID!
    name: String!
  }

  type Film {
    id: ID!
    title: String!
    releaseDate: String
  }

  type Species {
    id: ID!
    name: String
    designation: String
    classification: String
    averageHeight: Int
    averageLifespan: Int
    language: String
    homeworld: Planet
  }

  type Vehicle {
    id: ID!
    name: String
    consumables: String
    crew: String
    created: String
    manufacturers: [String]
  }

  # This "Book" type can be used in other type declarations.
  type Person {
    id: ID!
    created: String
    name: String
    birthYear: String
    eyeColor: String
    hairColor: String
    height: Int
    mass: Int
    homeworld: Planet
    species: Species
    films: [Film]
    vehicles: [Vehicle]
  }

  # The "Query" type is the root of all GraphQL queries.
  # (A "Mutation" type will be covered later on.)
  type Query {
    allPeople: [Person]
  }
`;

/*
{
    "created": "2014-12-09T13:50:51.644000Z",
    "id": "cGVvcGxlOjE=",
    "name": "Luke Skywalker",
    "birthYear": "19BBY",
    "eyeColor": "blue",
    "hairColor": "blond",
    "height": 172,
    "mass": 77,
    "homeworld": {
      "id": "cGxhbmV0czox",
      "name": "Tatooine"
    },
    "species": {
      "name": "Human",
      "designation": "sentient",
      "classification": "mammal",
      "id": "c3BlY2llczox",
      "averageHeight": 180,
      "averageLifespan": 120,
      "language": "Galactic Basic",
      "homeworld": {
        "id": "cGxhbmV0czo5",
        "name": "Coruscant"
      }
    },
    "films": [
      {
        "id": "ZmlsbXM6MQ==",
        "releaseDate": "1977-05-25",
        "title": "A New Hope"
      },
    ],
    "vehicles": [
      {
        "name": "Snowspeeder",
        "consumables": "none",
        "crew": "2",
        "created": "2014-12-15T12:22:12Z",
        "manufacturers": [
          "Incom corporation"
        ]
      },
*/

const transformSelectionSetToFields = ({ selections }, parentPath) => {
  return selections.reduce((fields, { selectionSet, name }) => {
    const path = name.value;

    if (selectionSet) {
      return fields.concat(transformSelectionSetToFields(selectionSet, path));
    }

    fields.push(parentPath ? `${parentPath}.${path}` : path);

    return fields;
  }, []);
};

// Resolvers define the technique for fetching the types in the
// schema.  We'll retrieve books from the "books" array above.
const resolvers = {
  Query: {
    allPeople: async (parent, params, { elasticsearch }, info) => {
      // Fetch the info for the current part of the query that we're executing
      // TODO: Can this actually just be info.fieldNodes[0] ?
      const currentField = info.fieldNodes.find(
        node => node.name.value == info.fieldName
      );

      const fields = transformSelectionSetToFields(currentField.selectionSet);

      const response = await elasticsearch.search({
        index: "swapi",
        type: "person",
        _source: fields
      });

      debugger;

      return response.hits.hits.map(hit => hit._source);
    }
  }
};

// In the most basic sense, the ApolloServer can be started
// by passing type definitions (typeDefs) and the resolvers
// responsible for fetching the data for those types.
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: req => ({
    elasticsearch: new Elasticsearch({
      host: "localhost:9200",
      log: "trace"
    })
  })
});

// This `listen` method launches a web-server.  Existing apps
// can utilize middleware options, which we'll discuss later.
server.listen().then(({ url }) => {
  console.log(`🚀  Server ready at ${url}`);
});
