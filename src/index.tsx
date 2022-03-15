import React from 'react';
import { render } from 'react-dom';
import { interfaces, Container, METADATA_KEY } from 'inversify';

import './styles.css';

import './di';

const rootElement = document.getElementById('root');

render(<hr />, rootElement);

function logger(planAndResolve: interfaces.Next): interfaces.Next {
  return (args: interfaces.NextArgs) => {
    let start = new Date().getTime();
    let result = planAndResolve(args);
    let end = new Date().getTime();
    console.log(`wooooo  ${end - start}`);
    return result;
  };
}

interface FunctionWithMetadata extends Function {
  constructorInjections: interfaces.ServiceIdentifier<any>[];
  propertyInjections: PropertyInjectionMetadata[];
}

interface PropertyInjectionMetadata {
  propName: string;
  injection: interfaces.ServiceIdentifier<any>;
}

class StaticPropsMetadataReader implements interfaces.MetadataReader {
  public getConstructorMetadata(
    constructorFunc: FunctionWithMetadata,
  ): interfaces.ConstructorMetadata {
    const formatMetadata = (
      injections: interfaces.ServiceIdentifier<any>[],
    ) => {
      const userGeneratedMetadata: interfaces.MetadataMap = {};
      injections.forEach((injection, index) => {
        const metadata: interfaces.Metadata = {
          key: METADATA_KEY.INJECT_TAG,
          value: injection,
        };
        if (Array.isArray(userGeneratedMetadata[index])) {
          userGeneratedMetadata[index]!.push(metadata);
        } else {
          userGeneratedMetadata[index] = [metadata];
        }
      });
      return userGeneratedMetadata;
    };

    const constructorInjections = constructorFunc.constructorInjections;

    if (!Array.isArray(constructorInjections)) {
      throw new Error('Missing constructorInjections annotation!');
    }

    const userGeneratedConsturctorMetadata = formatMetadata(
      constructorInjections,
    );

    return {
      // compilerGeneratedMetadata lenght must match userGeneratedMetadata
      // we expose compilerGeneratedMetadata because if your custom annotation
      // system is powered by decorators. The TypeScript compiler could generate
      // some metadata when the emitDecoratorMetadata flag is enabled.
      compilerGeneratedMetadata: new Array(constructorInjections.length),
      userGeneratedMetadata: userGeneratedConsturctorMetadata,
    };
  }

  public getPropertiesMetadata(
    /* constructorFunc */ _: FunctionWithMetadata,
  ): interfaces.MetadataMap {
    // const formatMetadata = (injections: PropertyInjectionMetadata[]) => {
    //     const userGeneratedMetadata: interfaces.MetadataMap = {};
    //     injections.forEach((propInjection, index) => {
    //         const metadata = new Metadata(METADATA_KEY.INJECT_TAG, propInjection.injection);
    //         if (Array.isArray(userGeneratedMetadata[propInjection.propName])) {
    //             userGeneratedMetadata[propInjection.propName].push(metadata);
    //         } else {
    //             userGeneratedMetadata[propInjection.propName] = [metadata];
    //         }
    //     });
    //     return userGeneratedMetadata;
    // };

    // const propertyInjections = constructorFunc.propertyInjections;

    // if (!Array.isArray(propertyInjections)) {
    //     throw new Error("Missing propertyInjections annotation!");
    // }

    // const userGeneratedPropertyMetadata = formatMetadata(propertyInjections);
    // return userGeneratedPropertyMetadata;

    return {};
  }
}

let container = new Container();
container.applyMiddleware(logger);
container.applyCustomMetadataReader(new StaticPropsMetadataReader());
