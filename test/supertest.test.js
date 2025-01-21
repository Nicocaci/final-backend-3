/** @format */

import supertest from "supertest";
import chai from "chai";
import config from "../src/config/config.js";
const PORT = config.app.PORT || 8080;
const expect = chai.expect;
const requester = supertest(`http://localhost:${PORT}`);

describe("Testing de la App Web Adoptame", () => {
    describe("Testing de Mascotas", () => {
        it("Endpoint POST /api/pets debe crear una mascota correctamente", async () => {
            const ramboMock = {
                name: "Rambo",
                specie: "Pichicho",
                birthDate: "2021-03-10",
            };
            const { statusCode, ok, _body } = await requester.post("/api/pets").send(ramboMock);
            //   console.log(statusCode);
            //   console.log(ok);
            //   console.log(_body);
            expect(_body.payload).to.have.property("_id");
        });
        it("Al crear una mascota solo con los datos elementales, se debe corroborar que la mascota creada cuente con una propiedad adopted:false", async () => {
            const nuevaMascota = {
                name: "Rex",
                specie: "Perrito",
                birthDate: "2021-01-01",
            };
            const { statusCode, _body } = await requester.post("/api/pets").send(nuevaMascota);

            expect(statusCode).to.equal(200);
            expect(_body.payload).to.have.property("adopted").that.equals(false);
        });
        it("Si se desea crear una mascota sin el campo nombre, debe responder con status 400", async () => {
            const mockSinNombre = {
                specie: "Gato",
                birthDate: "2023-05-15",
            };
            const { statusCode } = await requester.post("/api/pets").send(mockSinNombre);

            expect(statusCode).to.equal(400);
        });
        it("Al obtener a las mascotas con el metodo GET, la respuesta debe tener los campos status y payload. Ademas, payload debe ser de tipo Arreglo.", async () => {
            const { statusCode, _body } = await requester.get("/api/pets");

            expect(statusCode).to.equal(200);
            expect(_body).to.have.property("status").that.equals("success");
            expect(_body).to.have.property("payload").that.is.an("array");
        });
        it("El metodo PUT debe poder actualizar correctamente una mascota determinada (esto se puede testear comparando el valor previo con el nuevo valor de la base de datos).", async () => {
            const idMascotaExistente = "673d255ae4db9a3f8ce4c80e";
            const datosActualizados = {
                name: "Rambo I",
                specie: "Perrazo",
            };

            const { statusCode, _body } = await requester.put(`/api/pets/${idMascotaExistente}`).send(datosActualizados);
            expect(statusCode).to.equal(200);
        });

        it("El metodo DELETE debe poder borrar la última mascota agregada, esto se puede alcanzar agregando a la mascota con un POST, tomando el ID, borrando la mascota con DELETE y luego corroborar si la mascota existe con un GET", async () => {
            //Agregar nueva mascota:

            const nuevaMascotaParaBorrar = {
                name: "mascota a borrar",
                specie: "Perrito",
                birthDate: "2023-02-20",
            };
            const {
                _body: {
                    payload: { _id },
                },
            } = await requester.post("/api/pets").send(nuevaMascotaParaBorrar);

            // Borrar la mascota agregada:
            const { statusCode } = await requester.delete(`/api/pets/${_id}`);

            //Verificamos:
            expect(statusCode).to.equal(200);
        });
    });
    describe("Test Usuarios", () => {
        let cookie;
        it("Debe registrar correctamente un usuario", async () => {
            const mockUsuario = {
                first_name: "Pepe",
                last_name: "Argento",
                email: "pepe@zapateriagarmendia.com",
                password: "1234",
            };
            const { _body } = await requester.post("/api/sessions/register").send(mockUsuario);
            expect(_body.payload).to.be.ok;
        });

        it("Debe logear correctamente al usuario y recuperar la cookie", async () => {
            const mockUsuario = {
                email: "pepe@zapateriagarmendia.com",
                password: "1234",
            };
            const resultado = await requester.post("/api/sessions/login").send(mockUsuario);

            // En resultado me guardo los headers de la petición
            // Se obtiene la cookie de sesión de respuesta y se guarda en la variable
            const cookieResultado = resultado.headers["set-cookie"][0];
            // Verifico que la cookie exista
            expect(cookieResultado).to.be.ok;
            // Se separa el nombre y el valor de la cookie recuperada y se guarda en un objeto
            cookie = {
                name: cookieResultado.split("=")[0],
                value: cookieResultado.split("=")[1].split(";")[0],
            };
            // Se verifica que el nombre de la cookie sea igual a "coderCookie"
            expect(cookie.name).to.be.ok.and.equal("coderCookie");
            expect(cookie.value).to.be.ok;
        });

        // Probamos la ruta Current
        it("Debe enviar la cookie que contiene el usuario", async () => {
            // Enviamos la cookie que nos guardamos
            const { statusCode, _body } = await requester.get("/api/sessions/current").set("Cookie", `${cookie.name}=${cookie.value}`).timeout(5000);
            // Verificamos que nos retorne el email
            expect(statusCode).to.equal(200);
            expect(_body.payload.email).to.be.equal("pepe@zapateriagarmendia.com");
        });
    });

    //Testing con carga de imagenes
    describe("Testeamos la carga de Imagenes", () => {
        it("Tenemos que crear una mascota con una imagen", async () => {
            const mascotaMockeada = {
                name: "Michi",
                specie: "Gatito Naranja",
                birthDate: "2021-06-01",
            };
            // Usamos el método field para los campos y attach para el archivo de imagen
            const resultado = await requester.post("/api/pets/withimage").field("name", mascotaMockeada.name).field("specie", mascotaMockeada.specie).field("birthDate", mascotaMockeada.birthDate).attach("image", "./test/gatoNaranja.jpg").timeout(5000);

            // Verificamos:
            expect(resultado.status).to.be.equal(200);

            // Podemos verificar que la mascota tenga el campo Id
            expect(resultado._body.payload).to.have.property("_id");
            // Podemos verificar que la mascota tenga el campo Image
            expect(resultado._body.payload.image).to.be.ok;
        });
    });

    // Aca va el Test de Adoption
    describe("Test de las rutas de Adoption", () => {
        it("Debe registrar correctamente una adopción", async () => {
            const mockMascota = {
                name: "Capitán",
                specie: "Perro",
                birthDate: "2019-04-12",
            };

            const petResponse = await requester.post("/api/pets").send(mockMascota);
            // console.log("Pet Response:", petResponse._body);
            const petId = petResponse._body.payload?._id;
            expect(petId).to.not.be.undefined;

            const mockUsuario = {
                first_name: "Cacho",
                last_name: "Castaña",
                email: "cacho@debuenosaires.com",
                password: "1234",
            };

            const userResponse = await requester.post("/api/sessions/register").send(mockUsuario);
            // console.log("User Response:", userResponse._body);
            const userId = userResponse._body.payload;
            expect(userId).to.not.be.undefined;

            const mockAdopcion = {
                uid: userId,
                pid: petId,
                adoptionDate: "2024-11-19",
            };

            const response = await requester.post(`/api/adoptions/${userId}/${petId}`).send(mockAdopcion).timeout(10000);
            // console.log("Adoption Response:", response._body);

            expect(response.status).to.equal(200); // Ajuste aquí
            expect(response._body).to.have.property("status", "success");
            expect(response._body).to.have.property("message", "Pet adopted");
        });
        it("Debe poder encontrar una adopción correctamente al pasarle su ID", async () => {
            const adopcionId = "673d27bf6db1950e9b17acbc";
            const { statusCode } = await requester.get(`/api/adoptions/${adopcionId}`);
            expect(statusCode).to.equal(200);
        });
        it("Al obtener a las adopciones con el metodo GET, la respuesta debe tener los campos status y payload. Ademas, payload debe ser de tipo Arreglo.", async () => {
            const { statusCode, _body } = await requester.get("/api/adoptions");

            expect(statusCode).to.equal(200);
            expect(_body).to.have.property("status").that.equals("success");
            expect(_body).to.have.property("payload").that.is.an("array");
        });
    });
});
