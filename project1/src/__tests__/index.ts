import app from "../app";
import request from "supertest";
import { Block } from "../block";

describe("GET /block/:height - getting block by height", () => {
  it("Genesis Block", async () => {
    const result = await request(app).get("/block/0");
    const response: Block = JSON.parse(result.text);
    expect(response.height).toEqual(0);
    expect(response.previousBlockHash).toBeNull();
    expect(result.status).toEqual(200);
  });

  it("Invalid Block", async () => {
    const result = await request(app).get("/block/a");
    expect(result.text).toEqual('Block Not Found!');
    expect(result.status).toEqual(404);
  });

  it("Undefined Height", async () => {
    const result = await request(app).get("/block");
    expect(result.status).toEqual(404);
  });
});

describe("POST /requestValidation - ..", () => {
    it("Response to valid address should be json", async () => {
      const result = await request(app).post("/requestValidation"  )
      .send({"address": "myoJTcHCub3aLJ4aGmRzMGxbTUYHRAJJcF"})
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
    });
  });