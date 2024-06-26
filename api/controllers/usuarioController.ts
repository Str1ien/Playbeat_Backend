import { NextFunction, Response } from "express";
import { Request } from "express-jwt";

import * as usuarioTypesJs from "../utils/types/usuarioTypes.js";
import { hashPassword } from "../utils/hashContrasegna.js";
import * as usuarioDbJs from "../../db/usuarioDb.js";
import { toBoolean } from "../utils/toBoolean.js";

export async function usuarioModify(
  req: usuarioTypesJs.ModifyRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const idUsuario = Number(req.auth?.idUsuario);
    if (!(await usuarioDbJs.usuarioExistPrisma(idUsuario)))
      return res.sendStatus(404);

    const { contrasegna, imgPerfil, idUltimoAudio, segFinAudio } = req.body;
    const hashed = contrasegna == null ? 
      null :
      hashPassword(contrasegna);

    const usuario = await usuarioDbJs.usuarioModifyPrisma(
      idUsuario,
      hashed,
      imgPerfil,
      idUltimoAudio,
      segFinAudio,
    );
    if (usuario) {
      usuario.contrasegna = null;
    } 
    return res.status(201).json({ usuario });
  } catch (error) {
    return next(error);
  }
}

// $2b$10$7qHYgeKhM561uuqj4Ya4xuCxIXobbL3famnV88c3.YmHjd5qno//6
// $2b$10$7qHYgeKhM561uuqj4Ya4xuCxIXobbL3famnV88c3.YmHjd5qno//6

/**
 * Usuario controller that gets the current usuario based on the JWT given.
 * @param req Request with an authenticated usuario on the auth property.
 * @param res Response
 * @param next NextFunction
 * @returns void
 */
export async function usuarioGet(
  req: usuarioTypesJs.GetRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const idUsuario = Number.isNaN(req.query.idUsuario) ? Number(req.auth?.idUsuario) : req.query.idUsuario;
    const rrss = req.query.rrss;
        
    const [currentUsuario, nEscuchas, oyentesMensuales, ultimoLanzamiento,usuariosAlcanzados,usuariosAlcanzadosUltimoMes] = await Promise.all([
      usuarioDbJs.usuarioGetPrisma(
        idUsuario,
        rrss,
      ),
      usuarioDbJs.usuarioGetNEscuchas(idUsuario),
      usuarioDbJs.usuarioGetOyentesMensuales(idUsuario),
      usuarioDbJs.usuarioGetUltimoLanzamiento(idUsuario),
      usuarioDbJs.usuarioGetPersonasHanEscuchado(idUsuario),
      usuarioDbJs.usuarioGetPersonasHanEscuchadoUltimoMes(idUsuario),
    ]);
    if (!currentUsuario) return res.sendStatus(404);
    currentUsuario.contrasegna = null;


    return res.status(200).json({ ...currentUsuario,nEscuchas:nEscuchas,oyentesMensuales:oyentesMensuales,ultimoLanzamiento:ultimoLanzamiento, usuariosAlcanzados:usuariosAlcanzados,usuariosAlcanzadosUltimoMes: usuariosAlcanzadosUltimoMes });
  } catch (error) {
    return next(error);
  }
}

/**
 * Usuario controller that gets the current usuario based on the JWT given.
 * @param req Request with an authenticated usuario on the auth property.
 * @param res Response
 * @param next NextFunction
 * @returns void
 */
export async function usuarioGetAudios(
  req: usuarioTypesJs.GetRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const idUsuario = Number.isNaN(req.query.idUsuario) || req.query.idUsuario == undefined 
      ? Number(req.auth?.idUsuario) 
      : Number(req.query.idUsuario);
    if (idUsuario == undefined) return res.status(400).json({ message: "Bad request. Missing idUsuario" });
    const privada = req.query.idUsuario == undefined || Number.isNaN(req.query.idUsuario);

    let cancion, podcast;
    try {
      cancion = toBoolean(req.query, 'canciones');
      podcast = toBoolean(req.query, 'podcasts');
      if (cancion == null && podcast == null) {
        cancion = true; podcast = true;
      }
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
    const audios = await usuarioDbJs.usuarioGetAudios(idUsuario, cancion as boolean, podcast as boolean, privada);

    return res.status(200).json(audios);
  } catch (error) {
    return next(error);
  }
}

export async function usuarioFollow(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const idUsuario = Number(req.auth?.idUsuario);
    const idSeguido = Number(req.params.seguido);
    
    if (!(await usuarioDbJs.usuarioExistPrisma(idSeguido)))
      return res.sendStatus(404);

    await usuarioDbJs.usuarioFollowPrisma(idUsuario, idSeguido);
    return res.sendStatus(201);
  } catch (error) {
    return next(error);
  }
}

export async function usuarioUnfollow(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const idUsuario = Number(req.auth?.idUsuario);
    const idSeguido = Number(req.params.seguido);

    if (!(await usuarioDbJs.usuarioExistPrisma(idSeguido)))
      return res.sendStatus(404);

    const usuario = await usuarioDbJs.usuarioUnfollowPrisma(
      idUsuario,
      idSeguido,
    );
    return res.status(201).json({ usuario });
  } catch (error) {
    return next(error);
  }
}


export async function lastAudios(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const idUsuario = Number(req.auth?.idUsuario);
    if(!req.params.numAudios){
      return res.status(400).json({ message: "Bad request. Missing numAudios" });
    }
    if (Number(req.params.numaudios) <= 0) {
      return res.status(400).json({ message: "Bad request. numAudios must be a positive number" });
    }
    const audios = await usuarioDbJs.usuarioGetLastAudiosAndPodcasts(idUsuario,Number(req.params.numAudios));
    return res.status(200).json(audios);
  } catch (error) {
    return next(error);
  }
}


export async function topAudios(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    if(!req.query.numAudios){
      return res.status(400).json({ message: "Bad request. Missing numAudios" });
    }
    if (Number(req.query.numaudios) <= 0) {
      return res.status(400).json({ message: "Bad request. numAudios must be a positive number" });
    }
    const usuarioTarget = Number(req.query.userId);
    const audios = await usuarioDbJs.usuarioGetTopAudios(usuarioTarget,Number(req.query.numAudios));
    return res.status(200).json(audios);
  } catch (error) {
    return next(error);
  }
}

export async function historico(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const idUsuario = Number(req.auth?.idUsuario);
    const date = req.body.date; //formato "MM-YYYY"

    if (!date || !/^([0-9]{2})-([0-9]{4})$/.test(date)) {
        return res.status(400).send('Bad Parameters, falta parámetro date o formato de fecha incorrecto');
    }else{
        const [month, year] = date.split('-').map(Number);
        if (month < 1 || month > 12 || year < 1800) {
            return res.status(400).send('Bad Parameters, fecha no válida');
        }
        const stats = await usuarioDbJs.usuarioGetHistorico(idUsuario, month, year);
        return res.status(200).json(stats);
      }
  } catch (error) {
    return next(error);
  }
}

export async function getIdUsuario(  
  req: Request,
  res: Response,
  next: NextFunction
){
    try {
      const nombreUsu = req.params.nombreUsuario;
      const idUsuario = await usuarioDbJs.usuarioGetId(nombreUsu);
      if(!idUsuario){
        return res.status(404).json({ message: "Usuario no encontrado" });
      }
      return res.status(200).json({ idUsuario });
    } catch (error) {
      return next(error);
    }

}