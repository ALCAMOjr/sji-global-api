import supertest from 'supertest';
import { server, app } from '../index.js';
import { pool } from '../db.js';
import { testInitializeCoordinador, DeleteAllAbogados } from "./helpers.js"

const api = supertest(app);

let tokenCoordinador;
let abogadoId;

beforeAll(async () => {
    await DeleteAllAbogados()
    await testInitializeCoordinador();

    const response = await api
        .post('/api/abogados/login')
        .send({
            username: process.env.COORDINADOR_USERNAME_TEST,
            password: process.env.COORDINADOR_PASSWORD_TEST
        })
        .expect(200);

    tokenCoordinador = response.body.token;

});

afterAll(async () => {
    await pool.end();
    server.close();
});

describe('Abogados API', () => {

    describe('Login', () => {
        test('Login successful with valid credentials', async () => {
            const response = await api
                .post('/api/abogados/login')
                .send({
                    username: process.env.COORDINADOR_USERNAME_TEST,
                    password: process.env.COORDINADOR_PASSWORD_TEST
                })
                .expect(200);

            expect(response.body.token).toBeDefined();
        });

        test('Login fails with incorrect credentials', async () => {
            await api
                .post('/api/abogados/login')
                .send({
                    username: 'incorrectUsername',
                    password: 'incorrectPassword',
                })
                .expect(400);
        });

        test('Login fails with missing username', async () => {
            await api
                .post('/api/abogados/login')
                .send({
                    password: process.env.COORDINADOR_PASSWORD_TEST
                })
                .expect(400);
        });

        test('Login fails with missing password', async () => {
            await api
                .post('/api/abogados/login')
                .send({
                    username: process.env.COORDINADOR_USERNAME_TEST
                })
                .expect(400);
        });
    });

    describe('Register', () => {
        test('Register new abogado', async () => {
            const newAbogado = {
                username: 'newuser',
                password: 'newpassword',
                userType: 'coordinador',
                nombre: 'New',
                apellido: 'User',
                cedula: '12345678',
                email: 'alfredocastellanoula.14@gmail.com',
                telefono: '0987654321'
            };

           const registerResponse = await api
                .post('/api/abogados/register')
                .set('Authorization', `Bearer ${tokenCoordinador}`)
                .send(newAbogado)
                .expect(201);
                abogadoId = registerResponse.body.id;
        });

        test('Register fails with existing username', async () => {
            const existingAbogado = {
                username: process.env.COORDINADOR_USERNAME_TEST,
                password: 'password',
                userType: 'coordinador',
                nombre: 'Admin',
                apellido: 'User',
                cedula: 'AdminCedula',
                email: 'admin2@example.com',
                telefono: '1234567890'
            };

            await api
                .post('/api/abogados/register')
                .set('Authorization', `Bearer ${tokenCoordinador}`)
                .send(existingAbogado)
                .expect(400);
        });

        test('Register fails with missing fields', async () => {
            const newAbogado = {
                password: 'newpassword',
                userType: 'coordinador'
            };

            await api
                .post('/api/abogados/register')
                .set('Authorization', `Bearer ${tokenCoordinador}`)
                .send(newAbogado)
                .expect(400);
        });

        test('Register fails with unauthorized user', async () => {
            const newAbogado = {
                username: 'unauthorizeduser',
                password: 'newpassword',
                userType: 'coordinador',
                nombre: 'Unauthorized',
                apellido: 'User',
                cedula: '12345678',
                email: 'unauthorizeduser@example.com',
                telefono: '0987654321'
            };

            await api
                .post('/api/abogados/register')
                .send(newAbogado)
                .expect(401);
        });
    });

    describe('Update', () => {
        test('Update abogado information', async () => {
            const updatedAbogado = {
                username: 'updateduser',
                nombre: 'Updated',
                apellido: 'User',
                email: 'updateduser@example.com',
            };

            const response = await api
            .patch(`/api/abogados/${abogadoId}`)
                .set('Authorization', `Bearer ${tokenCoordinador}`)
                .send(updatedAbogado)
                .expect(200);

            expect(response.body.username).toBe(updatedAbogado.username);
        });

        test('Update fails with non-existing abogado', async () => {
            const updatedAbogado = {
                username: 'nonexistinguser',
                nombre: 'Non',
                apellido: 'Existing',
                email: 'nonexistinguser@example.com',
            };

            await api
                .patch('/api/abogados/9999')
                .set('Authorization', `Bearer ${tokenCoordinador}`)
                .send(updatedAbogado)
                .expect(404);
        });

        test('Update succeeds with missing optional fields', async () => {
            const partialUpdate = {
                username: 'partiallyUpdatedUser', 
              
            };
        
            const response = await api
                .patch(`/api/abogados/${abogadoId}`)
                .set('Authorization', `Bearer ${tokenCoordinador}`)
                .send(partialUpdate)
                .expect(200); 
        
            expect(response.body.username).toBe(partialUpdate.username);
        
        });

        test('Update fails with unauthorized user', async () => {
            const updatedAbogado = {
                username: 'unauthorizedupdate',
                nombre: 'Unauthorized',
                apellido: 'Update',
                email: 'unauthorizedupdate@example.com',
            };

            await api
            .patch(`/api/abogados/${abogadoId}`)
                .send(updatedAbogado)
                .expect(401);
        });
    });

    describe('Delete', () => {
        test('Delete abogado successfully!', async () => {
            await api
                .delete(`/api/abogados/${abogadoId}`) 
                .set('Authorization', `Bearer ${tokenCoordinador}`)
                .expect(204); 
        });
    
        test('Delete fails with non-existing abogado', async () => {
            await api
                .delete('/api/abogados/9999')
                .set('Authorization', `Bearer ${tokenCoordinador}`)
                .expect(404);
        });


        test('Delete fails with unauthorized user', async () => {
            await api
            .patch(`/api/abogados/${abogadoId}`)
                .expect(401);
        });
    });

  
});
